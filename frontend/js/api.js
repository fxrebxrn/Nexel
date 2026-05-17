async function authFetch(path, options = {}, canRetry = true) {
    const token = getAccessToken();

    if (!token) {
        logoutUser();
        return null;
    }

    const headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: headers
    });

    if (response.status !== 401) {
        return response;
    }

    if (!canRetry) {
        logoutUser();
        return null;
    }

    const refreshed = await refreshAccessToken();

    if (!refreshed) {
        logoutUser();
        return null;
    }

    return await authFetch(path, options, false);
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                refresh_token: refreshToken
            })
        });

        const data = await response.json();

        if (!response.ok) {
            logoutUser();
            return false;
        }

        localStorage.setItem("access_token", data.access_token);

        if (data.refresh_token) {
            localStorage.setItem("refresh_token", data.refresh_token);
        }

        return true;

    } catch (error) {
        console.error("Refresh token error:", error);
        return false;
    }
}
