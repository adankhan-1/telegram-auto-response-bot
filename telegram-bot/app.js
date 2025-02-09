require('dotenv').config();
const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const telegramApiId = +process.env.TELEGRAM_API_ID;
const telegramApiHash = process.env.TELEGRAM_API_HASH;
const sessionString = process.env.TELEGRAM_SESSION_STRING; // Leave empty if logging in for the first time

const client = new TelegramClient(new StringSession(sessionString), telegramApiId, telegramApiHash, { connectionRetries: 5 });

(async () => {
    console.log("Starting Telegram Client...");
    await client.start({
        phoneNumber: async () => await input.text("Enter your phone number: "),
        password: async () => await input.text("Enter your password (if enabled): "),
        phoneCode: async () => await input.text("Enter the code you received: "),
        onError: (err) => console.log(err),
    });

    console.log("You are logged in!");
    console.log("Session string:", client.session.save());
    console.log("Logged in as:", await client.getMe());

    // const openai = new OpenAI({
    //     apiKey: '',
    // });

    // async function getChatGPTResponse(userMessage) {
    //     try {
    //         const response = await openai.chat.completions.create({
    //             model: "gpt-3.5-turbo", // Use "gpt-4" if available
    //             messages: [{ role: "user", content: userMessage }],
    //             temperature: 0.7,
    //         });

    //         return response.data.choices[0].message.content.trim();
    //     } catch (error) {
    //         console.error("Error with ChatGPT API:", error);
    //         return "Sorry, couldn't process your request.";
    //     }
    // }


    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    let conversationHistory = [
        {
            role: "user",
            parts: [{ text: "Your name is Adan, male, age 28 years. Talk like a human, with friendly and informal tone." }]
        }
    ];

    async function getGeminiResponse(userMessage) {
        try {
            conversationHistory.push({ role: "user", parts: [{ text: userMessage }] });
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const chat = model.startChat({
                history: conversationHistory,
                generationConfig: {
                    maxOutputTokens: 300,
                }
            });
            const result = await chat.sendMessage(userMessage);
            const response = result.response.text();

            conversationHistory.push({ role: "model", parts: [{ text: response }] });
            return response;
        } catch (error) {
            console.error("Error with Gemini API:", error);
            return "Sorry, couldn't process your request.";
        }
    }

    // Listen for new messages
    client.addEventHandler(async (update) => {
        console.log("New event received!", update.className);


        if (update.className === "UpdateNewMessage" && update.message && !update.message.out) {
            console.log(update)
            const message = update.message;

            console.log(`Received: ${message.message}`);

            if (message.message.split(" ")[0].toLowerCase() != process.env.AI_PROMPT) {
                return;
            }

            const geminiResponse = await getGeminiResponse(message.message);

            await client.sendMessage(message.peerId, {
                message: geminiResponse,
            });

            console.log("Auto-reply sent!");
        }
        if (update.className === "UpdateShortMessage" && update.message && !update.out) {
            console.log(update)
            const message = update.message;

            console.log(`Received: ${message}`);

            if (message.split(" ")[0].toLowerCase() != process.env.AI_PROMPT) {
                return;
            }

            const userId = update.userId.value;
            const peerUser = new Api.InputPeerUser({ userId });

            const geminiResponse = await getGeminiResponse(message);

            console.log('RESPONSE FROM AI', geminiResponse)

            await client.sendMessage(peerUser, {
                message: geminiResponse,
            });

            console.log("Auto-reply sent!");
        }
    });
})();