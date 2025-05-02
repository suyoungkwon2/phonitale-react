// src/utils/api.js
const API_BASE_URL = 'https://wstvol0isg.execute-api.us-east-2.amazonaws.com/dev'; // Lambda 함수 URL

async function callApi(endpoint, method = 'POST', body = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            // 필요에 따라 다른 헤더 추가 가능 (예: 인증 토큰)
        },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        console.log(`Calling API: ${method} ${url}`, body ? `with body: ${JSON.stringify(body)}` : '');
        const response = await fetch(url, options);

        // 응답 본문이 비어있는 경우를 대비하여 처리
        let responseData = {};
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            responseData = await response.json();
        } else {
            // JSON이 아닌 응답 처리 (예: 텍스트)
            const textResponse = await response.text();
            console.log(`Non-JSON API Response from ${method} ${url}:`, textResponse);
            // 성공/실패 여부를 status code로 판단해야 함
            if (!response.ok) {
                 responseData = { error: textResponse || `API request failed with status ${response.status}` };
            } else {
                 responseData = { message: textResponse }; // 성공 메시지로 간주
            }
        }


        console.log(`API Response from ${method} ${url}:`, responseData);

        if (!response.ok) {
            // 오류 메시지가 responseData.error에 없을 경우 대비
            throw new Error(responseData.error || `API request failed with status ${response.status}`);
        }
        return responseData;
    } catch (error) {
        console.error(`API call error for ${method} ${url}:`, error);
        // 네트워크 오류 등 fetch 자체에서 발생한 오류 처리
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
             throw new Error('Network error: Failed to connect to the API server.');
        }
        throw error; // 그 외 오류는 다시 던짐
    }
}

export const submitConsent = async (consentData, group) => {
    // consentData: { name, phone, email, consent_agreed }
    // group: 'kss', 'naive', 'phonitale', 'og'
    const payload = { ...consentData, user_group: group }; // user_group 필드 추가
    console.log('Submitting consent with payload:', payload); // 페이로드 내용 로그 추가
    return callApi('/consent', 'POST', payload);
};

export const submitResponse = async (responseData, group) => {
    // responseData: { user, english_word, round_number, page_type, timestamp_in, timestamp_out, duration?, response?, usefulness?, coherence? }
    // group: 'kss', 'naive', 'phonitale', 'og'
    // duration은 선택적, Lambda에서 계산 가능
    const payload = { ...responseData, user_group: group };
    console.log('Submitting response with payload:', payload); // 로그 추가됨
    return callApi('/responses', 'POST', payload);
};

export const submitTotalDuration = async (summaryData) => {
    // summaryData: { email, name, page_type: 'final_summary', test_end_timestamp }
    if (!summaryData.email || !summaryData.name || summaryData.page_type !== 'final_summary' || !summaryData.test_end_timestamp) {
        console.error("Invalid data provided to submitTotalDuration:", summaryData);
        throw new Error("Invalid summary data for submitting final summary (email, name, page_type, test_end_timestamp required).");
    }
    // 엔드포인트는 /responses 유지
    return callApi('/responses', 'POST', summaryData);
}; 