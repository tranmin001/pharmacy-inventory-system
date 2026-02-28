#include "../include/Inventory.h"
#include <iostream>
#include <limits>

void displayMenu() {
    std::cout << "\n========================================" << std::endl;
    std::cout << "  PHARMACY INVENTORY MANAGEMENT SYSTEM  " << std::endl;
    std::cout << "========================================" << std::endl;
    std::cout << "1. Add Medication" << std::endl;
    std::cout << "2. Remove Medication" << std::endl;
    std::cout << "3. Update Quantity" << std::endl;
    std::cout << "4. Update Price" << std::endl;
    std::cout << "5. Display All Medications" << std::endl;
    std::cout << "6. Display Expired Medications" << std::endl;
    std::cout << "7. Display Low Stock Medications" << std::endl;
    std::cout << "8. Search Medication by Name" << std::endl;
    std::cout << "9. Exit" << std::endl;
    std::cout << "========================================" << std::endl;
    std::cout << "Enter your choice: ";
}

void clearInputBuffer() {
    std::cin.clear();
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
}

int main() {
    Inventory inventory;
    int choice;
    
    std::cout << "Welcome to Pharmacy Inventory Management System!" << std::endl;
    std::cout << "Based on real pharmacy workflow experience at Safeway" << std::endl;
    
    while (true) {
        displayMenu();
        std::cin >> choice;
        
        if (std::cin.fail()) {
            clearInputBuffer();
            std::cout << "Invalid input. Please enter a number." << std::endl;
            continue;
        }
        
        clearInputBuffer();
        
        switch (choice) {
            case 1: {
                std::string name, expDate;
                int quantity;
                double price;
                
                std::cout << "\nEnter medication name: ";
                std::getline(std::cin, name);
                std::cout << "Enter quantity: ";
                std::cin >> quantity;
                std::cout << "Enter expiration date (YYYY-MM-DD): ";
                std::cin >> expDate;
                std::cout << "Enter price: $";
                std::cin >> price;
                
                inventory.addMedication(name, quantity, expDate, price);
                break;
            }
            
            case 2: {
                int id;
                std::cout << "\nEnter medication ID to remove: ";
                std::cin >> id;
                inventory.removeMedication(id);
                break;
            }
            
            case 3: {
                int id, quantity;
                std::cout << "\nEnter medication ID: ";
                std::cin >> id;
                std::cout << "Enter new quantity: ";
                std::cin >> quantity;
                inventory.updateQuantity(id, quantity);
                break;
            }
            
            case 4: {
                int id;
                double price;
                std::cout << "\nEnter medication ID: ";
                std::cin >> id;
                std::cout << "Enter new price: $";
                std::cin >> price;
                inventory.updatePrice(id, price);
                break;
            }
            
            case 5: {
                inventory.displayAll();
                break;
            }
            
            case 6: {
                inventory.displayExpired();
                break;
            }
            
            case 7: {
                inventory.displayLowStock();
                break;
            }
            
            case 8: {
                std::string name;
                std::cout << "\nEnter medication name to search: ";
                std::getline(std::cin, name);
                inventory.searchByName(name);
                break;
            }
            
            case 9: {
                std::cout << "\nThank you for using Pharmacy Inventory Management System!" << std::endl;
                return 0;
            }
            
            default: {
                std::cout << "Invalid choice. Please try again." << std::endl;
                break;
            }
        }
    }
    
    return 0;
}