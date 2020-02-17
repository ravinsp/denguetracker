using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace DengueTracker.HPContract
{
    public class UserInputProcessor
    {
        private readonly Dictionary<string, List<string>> _inputs;
        private readonly Dictionary<string, List<string>> _outputs;
        private readonly DataContext _dataContext;
        private readonly string _superUserPubkey; // Only super user can manage organizations.

        private static readonly string AddOrg = "add-org";
        private static readonly string ListOrg = "list-org";
        private static readonly string CheckAuth = "check-auth";
        private static readonly string AddCase = "add-case";
        private static readonly string CountCase = "count-case";
        private static readonly string ListCase = "list-case";
        private static readonly string[] SupportedCommands = { AddOrg, ListOrg, CheckAuth, AddCase, CountCase, ListCase };

        public UserInputProcessor(Dictionary<string, List<string>> inputs, DataContext dataContext, string superUserPubkey)
        {
            _dataContext = dataContext;
            _inputs = inputs;
            _outputs = new Dictionary<string, List<string>>();
            _superUserPubkey = superUserPubkey;
        }

        public async Task<Dictionary<string, List<string>>> ProcessAsync()
        {
            foreach (var pubkey in _inputs.Keys)
            {
                bool isSuperUser = (pubkey == _superUserPubkey);
                var inputLines = _inputs[pubkey];

                foreach (var line in inputLines)
                {
                    (string command, string commandParam) = ParseInput(line);
                    if (command != null)
                    {
                        var output = await HandleInputAsync(command, commandParam, isSuperUser);
                        if (output != null)
                        {
                            AddOutput(pubkey, command, JsonConvert.SerializeObject(output));
                        }
                    }
                }
            }

            await _dataContext.SaveChangesAsync();
            return _outputs;
        }

        private async Task<dynamic> HandleInputAsync(string command, string commandParam, bool isSuperUser)
        {
            if (isSuperUser && command == AddOrg && !string.IsNullOrWhiteSpace(commandParam))
            {
                var org = JsonConvert.DeserializeObject<OrgModel>(commandParam);
                if (!string.IsNullOrWhiteSpace(org.Name) && !string.IsNullOrWhiteSpace(org.Key))
                {
                    _dataContext.Organizations.Add(new Organization
                    {
                        Name = org.Name,
                        Key = org.Key
                    });
                }
            }
            else if (isSuperUser && command == ListOrg)
            {
                return await _dataContext.Organizations.Select(o => new OrgModel
                {
                    Name = o.Name,
                    Key = o.Key
                }).ToListAsync();
            }
            else if (isSuperUser && command == CountCase)
            {
                return await _dataContext.CaseEntries.CountAsync();
            }
            else if (isSuperUser && command == ListCase && !string.IsNullOrWhiteSpace(commandParam))
            {
                int fromId = 0;
                if (int.TryParse(commandParam, out fromId))
                    return await _dataContext.CaseEntries.Where(c => c.Id >= fromId).ToListAsync();
            }
            else if (command == CheckAuth && !string.IsNullOrWhiteSpace(commandParam))
            {
                var org = await _dataContext.Organizations.FirstOrDefaultAsync(o => o.Key == commandParam);
                if (org != null)
                    return new { success = true, name = org.Name };
                else
                    return new { success = false };
            }
            else if (command == AddCase && !string.IsNullOrWhiteSpace(commandParam))
            {
                var caseModel = JsonConvert.DeserializeObject<CaseModel>(commandParam);
                var org = await _dataContext.Organizations.FirstOrDefaultAsync(o => o.Key == caseModel.CreatedBy);

                if (org != null) // Only accept cases from authorized organisations.
                {
                    _dataContext.CaseEntries.Add(new CaseEntry
                    {
                        IsPositive = caseModel.IsPositive,
                        Lat = caseModel.Lat,
                        Lon = caseModel.Lon,
                        CreatedBy = org.Id,
                        CreatedOnUtc = DateTime.UtcNow
                    });
                }
            }

            return null; //no output
        }

        private void AddOutput(string pubkey, string originalCommand, string content)
        {
            if (!_outputs.ContainsKey(pubkey))
                _outputs[pubkey] = new List<string>();

            var output = JsonConvert.SerializeObject(new
            {
                origin = originalCommand,
                content = content
            });

            _outputs[pubkey].Add(output);
        }

        private (string command, string commandParam) ParseInput(string input)
        {
            var parts = input.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 1 && SupportedCommands.Contains(parts[0]))
            {
                return (parts[0], parts.Length > 1 ? parts[1] : null);
            }
            return (null, null);
        }
    }
}