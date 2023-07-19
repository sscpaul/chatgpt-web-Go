import serviceAxios from "./request";

export const getUserInfo = () => {
    return serviceAxios({
        url: "/auth/info",
        method: "post",
    });
};

export const login = (params: Object) => {
    return serviceAxios({
        url: "/user/auth",
        method: "post",
        data: params,
    });
};

export const completion = (chatContext: any) => {
    return serviceAxios({
        url: "/chat/completion",
        method: "post",
        data: chatContext,
    });
};

export const getChatRecord = async () => {
    return serviceAxios({
        url: "/chat/userchatrecord",
        method: "post",
    });
};

export const getChatMessages = (chatID: any) => {
    return serviceAxios({
        url: "/chat/chatmessages",
        method: "post",
        data: {
            chatid: chatID,
        },
    });
};

export const renameChatSubject = (chatID: string, subject: string) => {
    return serviceAxios({
        url: "/chat/renamesubject",
        method: "post",
        data: {
            chatid: chatID, subject: subject,
        },
    });
};

export const deleteChat = (chatID: string) => {
    return serviceAxios({
        url: "/chat/deletechat",
        method: "post",
        data: {
            chatid: chatID
        },
    });
};

export const updatePassword = (name: string | undefined, oldPwd: string | undefined, newPwd: string) => {
    return serviceAxios({
        url: "/user/updatepassword",
        method: "post",
        data: {
            username: name,
            password: oldPwd,
            newpassword: newPwd,
        },
    });
};

export const createUser = (name: string, password: string) => {
    return serviceAxios({
        url: "/user/createuser",
        method: "post",
        data: {
            username: name,
            password: password,
        },
    });
};

export const getConfig = () => {
    return serviceAxios({
        url: "/chat/getconfig",
        method: "post",
        data: {},
    });
};

export const setConfig = (jsonObject: any) => {
    return serviceAxios({
        url: "/chat/setconfig",
        method: "post",
        data: {
            api_key: jsonObject.ApiKey,
            api_url: jsonObject.ApiURL,
            port: jsonObject.Port,
            listen: jsonObject.Listen,
            bot_desc: jsonObject.BotDesc,
            proxy: jsonObject.Proxy,
            max_tokens: jsonObject.MaxTokens,
            model: jsonObject.Model,
            temperature: jsonObject.Temperature,
            top_p: jsonObject.TopP,
            presence_penalty: jsonObject.PresencePenalty,
            frequency_penalty: jsonObject.FrequencyPenalty,
        },
    });
};
