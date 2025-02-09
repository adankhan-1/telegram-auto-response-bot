const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input"); // npm install input
const  { Api } = require("telegram");

const apiId = 24062141; // Replace with your API ID
const apiHash = "de5e9f48f7748dd2355fba259df25b06"; // Replace with your API Hash
const sessionString = "1BQANOTEuMTA4LjU2LjEyNwG7SXuxIp0P1edQ0ASdO68D9EsXmsQxyqbtmZ9m3lM7D8O4brVYDBp8UOb8m0M2tFo3VUi7ButzPOTSBm9Y2/j4HuydsojHsTPlmJXQCvZm9ffxckDlz+v6PE4r1Ca24ToCiFz6nP8xWy/boun8eARlcWZ2msLI/TjPZiUXT/EXvpP7WnD6QiIdIc9OIiENQHVQ6BeZ+OHLSL2wbAQps7VBMgKqWZpwDtxdWrBYg3ErlC38hFYMBw11HYx9lI93ItdmUHR6aVwfIDr8L2oMJxQyJVTmQMxCVXX/v35FqB4OtEddW5jNK4Ubih8winCgwcdSk9TYyYYbJLHbLlGO77KDJQ=="; // Leave empty if logging in for the first time

const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, { connectionRetries: 5 });

(async () => {
    console.log("Starting Telegram Client...");
    await client.start({
        phoneNumber: async () => await input.text("Enter your phone number: "),
        password: async () => await input.text("Enter your password (if enabled): "),
        phoneCode: async () => await input.text("Enter the code you received: "),
        onError: (err) => console.log(err),
    });

    console.log("You are logged in!");
    console.log("Session string:", client.session.save()); // Save this to avoid logging in again
    console.log("Logged in as:", await client.getMe());

    // Listen for new messages
    client.addEventHandler(async (update) => {
        console.log("New event received!", update.className); // Debugging
        
    
        if (update.className === "UpdateNewMessage" && update.message) {
            console.log(update)
            const message = update.message;
    
            if (!message.out) { // Ignore outgoing messages
                console.log(`Received: ${message.message}`);
    
                await client.sendMessage(message.peerId, {
                    message: "Hi, Adan is busy, please wait for sometime."
                });
    
                console.log("Auto-reply sent!");
            }
        }
    });
})();