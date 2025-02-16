const messageInput = document.querySelector(".message-input"); 
const chatBody = document.querySelector(".chat-body"); 
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeToggler = document.querySelector("#close-chatbot");

const API_KEY = "AIzaSyC6G8LYUyZnaTduPccj2WfG2hzc6CgK-X8";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const userData = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
}

const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");

    const requestOptions = {
       method: 'POST',
       headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({
        contents: [{
            parts: [{text: userData.message}, ...(userData.file.data ? [{ inline_data: userData.file }] : [])]
        }]
       })
    }

    try {
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);

        const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        messageElement.innerText = apiResponseText;

        console.log(data);
    } catch (error) {
        messageElement.innerText = error.message;
        messageElement.style.color = "#ff0000";
        console.log(error);
    } finally {
        userData.file = {};
        incomingMessageDiv.classList.remove("thinking")
        chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"})
    }
}

const handleOutgoingMessage = (e) => { 
    e.preventDefault();
    userData.message = messageInput.value.trim();
    if (!userData.message) return;
    messageInput.value = "";
    fileUploadWrapper.classList.remove("file-uploaded");

    const messageContent = `<div class="message-text"></div>
    ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ""}`;

    const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
    outgoingMessageDiv.querySelector(".message-text").textContent = userData.message;
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"})

    setTimeout(() => {
        const messageContent = `<div class="emoji-body">🤖</div>
                <div class="message-text">
                    <div class="thinking-indicator">
                        <div class="bot"></div>
                        <div class="bot"></div>
                        <div class="bot"></div>
                    </div>
                </div>`;

        const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"})
        generateBotResponse(incomingMessageDiv);

    }, 600)
}

messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { 
        e.preventDefault(); 
        handleOutgoingMessage(e); 
    }
});

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        fileUploadWrapper.querySelector("img").src= e.target.result;
        fileUploadWrapper.classList.add("file-uploaded"); 
        const base64String = e.target.result.split(",")[1];
        userData.file = {
            data: base64String,
            mime_type: file.type
        }
        fileInput.value = "";
    }

    reader.readAsDataURL(file);
});

fileCancelButton.addEventListener("click", () => {
    userData.file = {};
    fileUploadWrapper.classList.remove("file-uploaded");
});

const picker = new EmojiMart.Picker({
    theme: "light",
    skinTonePosition: "none",
    previewPosition: "none",
    onEmojiSelect: (emoji)=> {
        const {selectionStart: start, selectionEnd: end} = messageInput;
        messageInput.setRangeText(emoji.native, start, end, 'end');
        messageInput.focus();
    },
    onClickOutside: (e) => {
        if (e.target.id === "emoji-picker") {
            document.body.classList.toggle("show-emoji-picker");
        } else {
            document.body.classList.remove("show-emoji-picker");
        }
    }
});


document.querySelector(".chat-form").appendChild(picker);

sendMessageButton.addEventListener("click", (e)=> handleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click", (e)=> fileInput.click());
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
closeToggler.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
