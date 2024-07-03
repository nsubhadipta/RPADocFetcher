# RPADocFetcher - RPA Project with Puppeteer

Crawling (RPA) ,  merging PDF, convert lang into English from Korean

This project automates the task of logging into a website, navigating through it, and performing certain actions using Puppeteer, a Node.js library which provides a high-level API to control Chrome or Firefox over the DevTools Protocol.

## Features

- Automatically navigates to the specified website
- Closes any popup that appears
- Logs in using provided credentials
- Introduces a delay before clicking the login button
- Handles navigation after login

## Prerequisites

- Node.js (version 16 or higher recommended)
- npm (Node package manager)

## Installation

1. **Clone the repository**:

   ```sh
   git clone https://github.com/nsubhadipta/RPADocFetcher.git
2. **Navigate to the project directory**:

   ```sh
   cd RPADocFetcher
3. **Install the dependencies**:

   ```sh
   npm install
4. **Run the script**:

   ```sh
   node rpaFinal.js
## Code Explanation

The main script file ``rpaFinal.js`` contains the following functionality:

**Launching Puppeteer**: The script launches Puppeteer in headful mode (visible browser) for easier debugging and observation.

**Navigating to Website**: It navigates to the specified URL and waits until the network is idle.

**Handling Popups**: It closes any popup that appears on the homepage.

**Logging In**: It navigates to the login page, inputs the login credentials, and waits for a specified delay before clicking the login button.

**Post-Login Actions**: After logging in, the script waits for navigation to complete and is ready to perform further actions.

## Error Handling

The script includes error handling to log any issues encountered during execution and ensures the browser instance is properly closed even if an error occurs.

# Contributing
Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

# License
This project is licensed under the MIT License.

# Contact
For any questions or support, please contact [nsubhadipta@gmail.com].