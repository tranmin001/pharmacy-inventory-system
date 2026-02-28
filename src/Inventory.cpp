#include "../include/Inventory.h"
#include <iostream>
#include <algorithm>

Inventory::Inventory() : nextId(1) {}

void Inventory::addMedication(const std::string& name, int quantity,
                              const std::string& expirationDate, double price) {
    Medication med(nextId++, name, quantity, expirationDate, price);
    medications.push_back(med);
    std::cout << "Medication added successfully! ID: " << (nextId - 1) << std::endl;
}

bool Inventory::removeMedication(int id) {
    auto it = std::remove_if(medications.begin(), medications.end(),
                            [id](const Medication& med) { return med.getId() == id; });
    
    if (it != medications.end()) {
        medications.erase(it, medications.end());
        std::cout << "Medication removed successfully!" << std::endl;
        return true;
    }
    
    std::cout << "Medication with ID " << id << " not found." << std::endl;
    return false;
}

bool Inventory::updateQuantity(int id, int newQuantity) {
    Medication* med = findById(id);
    if (med) {
        med->setQuantity(newQuantity);
        std::cout << "Quantity updated successfully!" << std::endl;
        return true;
    }
    std::cout << "Medication with ID " << id << " not found." << std::endl;
    return false;
}

bool Inventory::updatePrice(int id, double newPrice) {
    Medication* med = findById(id);
    if (med) {
        med->setPrice(newPrice);
        std::cout << "Price updated successfully!" << std::endl;
        return true;
    }
    std::cout << "Medication with ID " << id << " not found." << std::endl;
    return false;
}

void Inventory::displayAll() const {
    if (medications.empty()) {
        std::cout << "No medications in inventory." << std::endl;
        return;
    }
    
    std::cout << "\n=== All Medications ===" << std::endl;
    for (const auto& med : medications) {
        med.display();
    }
    std::cout << std::endl;
}

void Inventory::displayExpired() const {
    std::cout << "\n=== Expired Medications ===" << std::endl;
    bool found = false;
    for (const auto& med : medications) {
        if (med.isExpired()) {
            med.display();
            found = true;
        }
    }
    if (!found) {
        std::cout << "No expired medications." << std::endl;
    }
    std::cout << std::endl;
}

void Inventory::displayLowStock() const {
    std::cout << "\n=== Low Stock Medications ===" << std::endl;
    bool found = false;
    for (const auto& med : medications) {
        if (med.isLowStock()) {
            med.display();
            found = true;
        }
    }
    if (!found) {
        std::cout << "No low stock medications." << std::endl;
    }
    std::cout << std::endl;
}

Medication* Inventory::findById(int id) {
    for (auto& med : medications) {
        if (med.getId() == id) {
            return &med;
        }
    }
    return nullptr;
}

void Inventory::searchByName(const std::string& name) const {
    std::cout << "\n=== Search Results ===" << std::endl;
    bool found = false;
    for (const auto& med : medications) {
        if (med.getName().find(name) != std::string::npos) {
            med.display();
            found = true;
        }
    }
    if (!found) {
        std::cout << "No medications found matching: " << name << std::endl;
    }
    std::cout << std::endl;
}

int Inventory::getNextId() const {
    return nextId;
}

bool Inventory::isEmpty() const {
    return medications.empty();
}