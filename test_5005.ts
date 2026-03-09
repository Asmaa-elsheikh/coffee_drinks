async function test() {
    const port = 5005;
    try {
        const res = await fetch(`http://localhost:${port}/api/non-existent-route`);
        console.log("Status:", res.status);
        const json = await res.json();
        console.log("Body:", json);
    } catch (e: any) {
        console.error("Fetch failed:", e.message);
    }
}

test();
