export const isValidIp = (ip: string) => {
    const parts = ip.trim().split(".");
    if (parts.length !== 4) return false;
    return parts.every((p) => {
        if (p === "" || !/^\d+$/.test(p)) return false;
        const n = Number(p);
        return n >= 0 && n <= 255;
    });
};