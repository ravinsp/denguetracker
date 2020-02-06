using Newtonsoft.Json;

namespace DengueTracker.HPContract
{
    public class OrgModel
    {
        [JsonProperty("name")]
        public string Name { get; set; }
        
        [JsonProperty("key")]
        public string Key { get; set; }
    }

    public class CaseModel
    {
        [JsonProperty("isPositive")]
        public bool IsPositive { get; set; }
        
        [JsonProperty("lat")]
        public double Lat { get; set; }
        
        [JsonProperty("lon")]
        public double Lon { get; set; }
        
        [JsonProperty("createdBy")]
        public string CreatedBy { get; set; }
    }
}