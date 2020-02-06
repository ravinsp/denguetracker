using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using DengueTracker.HPContract.HotPocket;
using System.Linq;
using System.Collections.Generic;

namespace DengueTracker.HPContract
{
    /* 
     * This is the dengue case tracking Hot Pocket contract which uses sqlite database as storage.
     * In order to run this .Net Core should be installed on the system. If using docker,
     * mcr.microsoft.com/dotnet/core/sdk:3.1 docker image must be used.
     * 
     * Produce deployable output with: dotnet publish -c Release
     *
     * User inputs can be submitted in the following format. (multiple inputs must be seperated by '\n')
     * Add a new organization:      add-org <org json>      (Only allowed for super user)
     * List organizations:          list-org                (Only allowed for super user)
     * Record a new case:           add-case <case json>
     */
    public class Program
    {
        static async Task<int> Main(string[] args)
        {
            if (args.Length != 1)
            {
                Console.Error.WriteLine("1 argument expected");
                return 1;
            }

            ContractArgs contractArgs = await HotPocketHelper.GetContractArgsAsync();

            var userInputs = new Dictionary<string, List<string>>();

            foreach (var user in contractArgs.UserPipes)
            {
                var pubkey = user.Key;
                var pipe = user.Value;

                var input = HotPocketHelper.ReadStringFromFD(pipe.ReadFD);
                if (!string.IsNullOrEmpty(input))
                {
                    var inputLines = input.Split('\n', StringSplitOptions.RemoveEmptyEntries).ToList();
                    if (inputLines.Any())
                        userInputs[pubkey] = inputLines;
                }
            }

            if (userInputs.Any())
            {
                using (var dataContext = new DataContext())
                {
                    dataContext.Database.Migrate();

                    var inputProcessor = new UserInputProcessor(userInputs, dataContext, args[0]);
                    var outputs = await inputProcessor.ProcessAsync();

                    // Send any outputs back to users
                    foreach(var pubkey in outputs.Keys)
                    {
                        foreach(var output in outputs[pubkey])
                        {
                            HotPocketHelper.WriteStringToFD(contractArgs.UserPipes[pubkey].WriteFD, output + "\n");
                        }
                    }
                }
            }

            return 0;
        }
    }
}
