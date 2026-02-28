#ifndef INVENTORY_H
#define INVENTORY_H

#include "Medication.h"
#include <vector>
#include <string>

class Inventory {
private:
    std::vector<Medication> medications;
    int nextId;

public:
    // Constructor
    Inventory();
    
    // Core operations
    void addMedication(const std::string& name, int quantity, 
                      const std::string& expirationDate, double price);
    bool removeMedication(int id);
    bool updateQuantity(int id, int newQuantity);
    bool updatePrice(int id, double newPrice);
    
    // Search and display
    void displayAll() const;
    void displayExpired() const;
    void displayLowStock() const;
    Medication* findById(int id);
    void searchByName(const std::string& name) const;
    
    // Utility
    int getNextId() const;
    bool isEmpty() const;
};

#endif