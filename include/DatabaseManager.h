#ifndef DATABASE_MANAGER_H
#define DATABASE_MANAGER_H

#include "sqlite3.h"
#include "Medication.h"
#include <string>
#include <vector>

class DatabaseManager {
private:
    sqlite3* db;
    std::string dbPath;
    
    bool executeQuery(const std::string& query);
    
public:
    DatabaseManager(const std::string& databasePath);
    ~DatabaseManager();
    
    bool connect();
    void disconnect();
    bool createTables();
    
    // CRUD operations
    bool saveMedication(const Medication& med);
    bool deleteMedication(int id);
    bool updateMedication(const Medication& med);
    std::vector<Medication> loadAllMedications();
    
    bool isConnected() const;
};

#endif