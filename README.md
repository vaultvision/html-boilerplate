# Vault Vision HTML Boilerplate
## A simple HTML and Javascript authentication boilerplate (starter kit) for developers and proto-type designers with security integrations like Webuauthn, FIDO2, and certified for OpenID Connect (OIDC), powered by Vault Vision's FastAuth

Download and install Node.js from nodejs.org/en/download/

Install the latest version of npm. This will be useful when running all the build commands. Run the following in a command line, either your IDE's Terminal window or in a Windows Command Prompt.

                                                            
    npm install --global npm@latest
                                                            
                                                        
Install the app dependencies by running the following command in the command line inside the folder root where you have unzipped the theme package archive.


    npm install
                                                        
After npm finishes installing the modules from package.json you can go ahead and start the application. To do so, run the command below.

You can also use yarn to install dependencies instead of npm.


    npm run start
                                                        
After the comand finished, you should see a Compiled successfully! message in your terminal window. Also, a web server service will be started so you can view your app in the browser: http://localhost:8080

To create a production optimised build run the command below:


    npm run build
                                                        
This created another folder in the root of your project named build. You'll have an option to start a local web server to view your newly created production build.
