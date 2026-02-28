#ifndef MEDICATION_H
#define MEDICATION_H

#include <string>
#include <ctime>

class Medication {
private:
    std::string name;
    int quantity;
    std::string expirationDate;
    double price;
    int id;

public:
    // Constructor
    Medication(int id, const std::string& name, int quantity, 
               const std::string& expirationDate, double price);
    
    // Getters
    int getId() const;
    std::string getName() const;
    int getQuantity() const;
    std::string getExpirationDate() const;
    double getPrice() const;
    
    // Setters
    void setQuantity(int newQuantity);
    void setPrice(double newPrice);
    
    // Utility functions
    bool isExpired() const;
    bool isLowStock() const;
    void display() const;
};

#endif