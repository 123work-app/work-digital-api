CREATE TABLE freelancer (                                 
id INTEGER PRIMARY KEY AUTOINCREMENT,                     
user_id INTEGER UNIQUE NOT NULL,                          
description TEXT,                                         
FOREIGN KEY (user_id) REFERENCES user(id)                 
);                                                        
CREATE TABLE freelancer_role (                            
ID INTEGER PRIMARY KEY AUTOINCREMENT,                     
freelancer_id INTEGER,                                    
role_id INTEGER,                                          
FOREIGN KEY (freelancer_id) REFERENCES freelancer(id)     
FOREIGN KEY (role_id) REFERENCES role(id)                 
UNIQUE (freelancer_id, role_id)                           
);                                                        
CREATE TABLE role (                                       
id INTEGER PRIMARY KEY AUTOINCREMENT,                     
name TEXT UNIQUE NOT NULL                                 
);                                                        
CREATE TABLE user (                                       
id INTEGER PRIMARY KEY AUTOINCREMENT,                     
cpf TEXT UNIQUE NOT NULL,                                 
name TEXT NOT NULL,                                       
email TEXT UNIQUE NOT NULL,                               
password TEXT NOT NULL,                                   
state TEXT NOT NULL,                                      
city TEXT NOT NULL,                                       
neighborhood TEXT NOT NULL,                               
street TEXT NOT NULL,                                     
number TEXT NOT NULL,                                     
phone TEXT NOT NULL,                                      
birthdate TEXT NOT NULL                                   
);                                                        
