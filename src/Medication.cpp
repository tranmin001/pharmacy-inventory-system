#include "../include/Medication.h"
#include <iostream>
#include <sstream>
#include <iomanip>

Medication::Medication(int id, const std::string& name, int quantity,
                       const std::string& expirationDate, double price)
    : id(id), name(name), quantity(quantity), expirationDate(expirationDate), price(price) {}

// Getters
int Medication::getId() const {
    return id;
}

std::string Medication::getName() const {
    return name;
}

int Medication::getQuantity() const {
    return quantity;
}

std::string Medication::getExpirationDate() const {
    return expirationDate;
}

double Medication::getPrice() const {
    return price;
}

// Setters
void Medication::setQuantity(int newQuantity) {
    quantity = newQuantity;
}

void Medication::setPrice(double newPrice) {
    price = newPrice;
}

// Check if medication is expired (simplified - compares date strings)
bool Medication::isExpired() const {
    time_t now = time(0);
    tm* ltm = localtime(&now);
    
    int currentYear = 1900 + ltm->tm_year;
    int currentMonth = 1 + ltm->tm_mon;
    int currentDay = ltm->tm_mday;
    
    // Parse expiration date (format: YYYY-MM-DD)
    int expYear, expMonth, expDay;
    char dash;
    std::stringstream ss(expirationDate);
    ss >> expYear >> dash >> expMonth >> dash >> expDay;
    
    if (expYear < currentYear) return true;
    if (expYear == currentYear && expMonth < currentMonth) return true;
    if (expYear == currentYear && expMonth == currentMonth && expDay < currentDay) return true;
    
    return false;
}

// Check if stock is low (threshold: 10 units)
bool Medication::isLowStock() const {
    return quantity < 10;
}

// Display medication information
void Medication::display() const {
    std::cout << "ID: " << id << " | "
              << "Name: " << name << " | "
              << "Quantity: " << quantity << " | "
              << "Expires: " << expirationDate << " | "
              << "Price: $" << std::fixed << std::setprecision(2) << price;
    
    if (isExpired()) {
        std::cout << " [EXPIRED]";
    }
    if (isLowStock()) {
        std::cout << " [LOW STOCK]";
    }
    std::cout << std::endl;
}