# Final Project

This project sets up a full-stack application with a Vue frontend, a Node.js backend, and a MySQL database, all managed with Docker and Docker Compose.

## Project Structure

- **Vue app**: Located in `library-management` directory.
- **Node.js API**: Located in `SERVER` directory, connects to the MySQL database.
- **MySQL database**: Initialized with a SQL dump upon setup. Data volumes are persistent through docker builds.

### About the Project

The online bookstore application allows for user creation, sign in, book purchasing, cart pages, place order features, and user management all with a frontend web UI. The project also includes admin features to add and remove catalog items.  

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine.
- [Docker Compose](https://docs.docker.com/compose/install/) for managing multi-container Docker applications.

### Setup Instructions

1. Clone this repository and navigate into the project directory:

   ```bash
   cd final-project
   ```

2. Run the following command to build and start containers

   ``` bash
   docker-compose up --build
    ```

3. Once everything is up and running, you can access the application:

    - **Vue App:** http://localhost:8080
    - **Node API:** http://localhost:3000

### Troubleshooting

If you encounter any errors or need to restart the containers, you can use:

    docker-compose down
    docker-compose up --build

## Notes

To test admin features, login with:

admin@1.com
admin123456

Payment information editing was created. However, allowing users to see payment methods and passwords from their account posed security risks. These features are commented out.

## Future Fixes

In the future, it would be beneficial to add an All Orders tab for admins to cancel or modify existing orders. The same can be said for an All Users tab, with restrictions pertaining to emails and passwords. For exmaple, users should be able to request a password change that is sent to their email. Admins should also be able to send users passwords change in case of needed assistance. Also incorporating Google logins and 2FA would be beneficial. 

The table storing customer orders does not actually process or store any payment methods or shipping addresses. This would be nice to store and incorporate to calcuate shipping fees and whatnot. Discount codes for checkout would also be easy to implement in the future.

Reviews and individual product pages would enhance customer usability.


