#include "../include/DatabaseManager.h"
#include <iostream>

DatabaseManager::DatabaseManager(const std::string& databasePath) 
    : db(nullptr), dbPath(databasePath) {}

DatabaseManager::~DatabaseManager() {
    disconnect();
}

bool DatabaseManager::connect() {
    int result = sqlite3_open(dbPath.c_str(), &db);
    
    if (result != SQLITE_OK) {
        std::cerr << "Error opening database: " << sqlite3_errmsg(db) << std::endl;
        return false;
    }
    
    std::cout << "Database connected successfully!" << std::endl;
    return createTables();
}

void DatabaseManager::disconnect() {
    if (db) {
        sqlite3_close(db);
        db = nullptr;
        std::cout << "Database disconnected." << std::endl;
    }
}

bool DatabaseManager::createTables() {
    std::string createTableSQL = 
        "CREATE TABLE IF NOT EXISTS medications ("
        "id INTEGER PRIMARY KEY, "
        "name TEXT NOT NULL, "
        "quantity INTEGER NOT NULL, "
        "expiration_date TEXT NOT NULL, "
        "price REAL NOT NULL);";
    
    return executeQuery(createTableSQL);
}

bool DatabaseManager::executeQuery(const std::string& query) {
    char* errorMsg = nullptr;
    int result = sqlite3_exec(db, query.c_str(), nullptr, nullptr, &errorMsg);
    
    if (result != SQLITE_OK) {
        std::cerr << "SQL error: " << errorMsg << std::endl;
        sqlite3_free(errorMsg);
        return false;
    }
    
    return true;
}

bool DatabaseManager::saveMedication(const Medication& med) {
    std::string insertSQL = 
        "INSERT INTO medications (id, name, quantity, expiration_date, price) "
        "VALUES (" + std::to_string(med.getId()) + ", "
        "'" + med.getName() + "', "
        + std::to_string(med.getQuantity()) + ", "
        "'" + med.getExpirationDate() + "', "
        + std::to_string(med.getPrice()) + ");";
    
    return executeQuery(insertSQL);
}

bool DatabaseManager::deleteMedication(int id) {
    std::string deleteSQL = 
        "DELETE FROM medications WHERE id = " + std::to_string(id) + ";";
    
    return executeQuery(deleteSQL);
}

bool DatabaseManager::updateMedication(const Medication& med) {
    std::string updateSQL = 
        "UPDATE medications SET "
        "name = '" + med.getName() + "', "
        "quantity = " + std::to_string(med.getQuantity()) + ", "
        "expiration_date = '" + med.getExpirationDate() + "', "
        "price = " + std::to_string(med.getPrice()) + " "
        "WHERE id = " + std::to_string(med.getId()) + ";";
    
    return executeQuery(updateSQL);
}

std::vector<Medication> DatabaseManager::loadAllMedications() {
    std::vector<Medication> medications;
    std::string selectSQL = "SELECT * FROM medications;";
    
    sqlite3_stmt* stmt;
    int result = sqlite3_prepare_v2(db, selectSQL.c_str(), -1, &stmt, nullptr);
    
    if (result != SQLITE_OK) {
        std::cerr << "Error preparing statement: " << sqlite3_errmsg(db) << std::endl;
        return medications;
    }
    
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        int id = sqlite3_column_int(stmt, 0);
        std::string name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
        int quantity = sqlite3_column_int(stmt, 2);
        std::string expDate = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
        double price = sqlite3_column_double(stmt, 4);
        
        Medication med(id, name, quantity, expDate, price);
        medications.push_back(med);
    }
    
    sqlite3_finalize(stmt);
    return medications;
}

bool DatabaseManager::isConnected() const {
    return db != nullptr;
}