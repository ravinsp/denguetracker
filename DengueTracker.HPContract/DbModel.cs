using System;
using Microsoft.EntityFrameworkCore;

namespace DengueTracker.HPContract
{
    public class DataContext : DbContext
    {
        public DbSet<Organization> Organizations { get; set; }
        public DbSet<CaseEntry> CaseEntries { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder options)
            => options.UseSqlite("Data Source=state/denguetracker.db");

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Organization>().HasIndex(o => o.Key).IsUnique();
        }
    }

    public class Organization
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Key { get; set; }
    }

    public class CaseEntry
    {
        public int Id { get; set; }
        public bool IsPositive { get; set; }
        public double Lat { get; set; }
        public double Lon { get; set; }
        public string CreatedBy { get; set; }
        public DateTime CreatedOnUtc { get; set; }
    }
}