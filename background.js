// Background Service Worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translate") {
        const text = request.text;

        // 1. Hàm lấy nghĩa Tiếng Việt (Có cơ chế Backup)
        const getMeaningPromise = async () => {
            // Ưu tiên 1: Google Translate (Clients5)
            try {
                const urlGoogle = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=vi&q=${encodeURIComponent(text)}`;
                const res = await fetch(urlGoogle);
                if (res.status === 429) throw new Error("Rate Limited");
                if (!res.ok) throw new Error(`Google Error ${res.status}`);
                const data = await res.json();
                if (Array.isArray(data) && data[0]) return data[0];
            } catch (err) {
                console.warn("Google API failed, trying backup...", err);
            }

            // Ưu tiên 2: MyMemory API (Backup khi Google chặn)
            try {
                const urlMyMemory = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`;
                const res = await fetch(urlMyMemory);
                const data = await res.json();
                // MyMemory đôi khi trả về lỗi trong responseData
                if (data && data.responseData && data.responseData.translatedText) {
                    if (!data.responseData.translatedText.includes("MYMEMORY WARNING")) {
                        return data.responseData.translatedText;
                    }
                }
            } catch (err) {
                console.error("Backup failed", err);
            }

            return "Lỗi dịch (Thử lại sau)";
        };

        // 2. Hàm lấy Phiên âm & Ví dụ (Dictionary API)
        const getDictDetailsPromise = async () => {
            try {
                const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${text}`);
                const data = await res.json();
                let result = { phonetic: "", example: "" };

                if (Array.isArray(data) && data.length > 0) {
                    const entry = data[0];
                    // Lấy phonetic
                    if (entry.phonetic) result.phonetic = entry.phonetic;
                    else if (entry.phonetics?.length) {
                        const p = entry.phonetics.find(p => p.text);
                        if (p) result.phonetic = p.text;
                    }
                    // Lấy example
                    if (entry.meanings) {
                        for (const m of entry.meanings) {
                            const def = m.definitions?.find(d => d.example);
                            if (def) {
                                result.example = def.example;
                                break;
                            }
                        }
                    }
                }
                return result;
            } catch (e) {
                return { phonetic: "", example: "" };
            }
        };

        // 3. Chạy song song và trả kết quả
        Promise.all([getMeaningPromise(), getDictDetailsPromise()])
            .then(([translatedText, dictData]) => {
                sendResponse({
                    translatedText: translatedText,
                    phonetic: dictData.phonetic,
                    example: dictData.example
                });
            });

        return true; // Giữ kết nối async
    }
});
