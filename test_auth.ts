async function test() {
    const port = 5005;
    try {
        const res = await fetch(`http://localhost:${port}/api/branches`);
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);
    } catch (e: any) {
        console.error("Fetch failed:", e.message);
    }
}

test();
