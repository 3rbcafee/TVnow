async function fetchTVGuideData() {
    const apiUrl = 'https://api.allorigins.win/raw?url=https://elcinema.com/tvguide/';
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Failed to fetch TV guide');
    return await response.text();
}

function extractShowInfo(slot) {
    const listItems = slot.querySelectorAll('ul li');
    if (listItems.length < 1) return null;

    let showName = '';
    const nameElement = listItems[0].querySelector('a');
    if (nameElement) {
        showName = nameElement.textContent.trim();
    } else {
        showName = listItems[0].textContent.trim();
    }

    return { name: showName };
}

function parseTVShows(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const tvLines = doc.querySelectorAll('.tv-line');
    const shows = [];

    tvLines.forEach(tvLine => {
        try {
            const channelDiv = tvLine.querySelector('.channel .columns.small-12.large-6:not(.hide)');
            let channelName = '';
            let channelLogo = '';

            if (channelDiv) {
                const channelLink = channelDiv.querySelector('a[title]');
                if (channelLink) {
                    channelName = channelLink.getAttribute('title');
                    const logoImg = channelLink.querySelector('img');
                    if (logoImg) {
                        channelLogo = logoImg.outerHTML;
                    }
                }
            }

            const slots = tvLine.querySelectorAll('.tv-slot');
            if (slots.length === 0) return;

            const currentSlot = slots[0];
            const showInfo = extractShowInfo(currentSlot);

            if (showInfo) {
                shows.push({
                    channelName: channelName,
                    channelLogo: channelLogo,
                    showName: showInfo.name
                });
            }
        } catch (error) {
            console.error('Error parsing TV line:', error);
        }
    });

    return shows;
}

function displayJSON(shows) {
    if (shows.length === 0) {
        return JSON.stringify({ error: 'No shows found' }, null, 2);
    }

    const data = {
        timestamp: new Date().toISOString(),
        totalChannels: shows.length,
        shows: shows
    };

    return JSON.stringify(data, null, 2);
}

// Main function to expose
async function getTVGuideJSON() {
    try {
        const htmlContent = await fetchTVGuideData();
        const shows = parseTVShows(htmlContent);
        return displayJSON(shows);
    } catch (error) {
        return JSON.stringify({ error: error.message }, null, 2);
    }
}

// Optional: expose globally if loaded via <script>
if (typeof window !== 'undefined') {
    window.getTVGuideJSON = getTVGuideJSON;
}
