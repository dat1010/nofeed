import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

type RssItem = {
  title: string;
  link: string;
  pubDate?: string;
};

const CommunityPage: React.FC = () => {
  const [items, setItems] = useState<RssItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRss() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          "https://discourse.nofeed.zone/latest.rss",
          { signal: controller.signal }
        );
        const xmlText = await response.text();

        const parser = new window.DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        const itemNodes = Array.from(xmlDoc.getElementsByTagName("item"));
        const parsed: RssItem[] = itemNodes.slice(0, 10).map((node) => ({
          title: node.getElementsByTagName("title")[0]?.textContent || "",
          link: node.getElementsByTagName("link")[0]?.textContent || "",
          pubDate: node.getElementsByTagName("pubDate")[0]?.textContent || undefined,
        }));

        setItems(parsed);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError("Failed to load community topics.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchRss();
    return () => controller.abort();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="columns is-centered">
          <div className="column is-two-thirds">
            <h1 className="title is-3">Community Forum</h1>
            <p className="subtitle is-6">Recent topics from our Discourse.</p>
            {isLoading && <p>Loading…</p>}
            {error && <p className="has-text-danger">{error}</p>}
            {!isLoading && !error && (
              <div className="box">
                {items.length === 0 ? (
                  <p>No topics found.</p>
                ) : (
                  <ul>
                    {items.map((item, idx) => (
                      <li key={idx} className="mb-3">
                        <a
                          href={`${item.link}?utm_source=app&utm_medium=community_page&utm_campaign=community`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="has-text-link"
                        >
                          {item.title}
                        </a>
                        {item.pubDate && (
                          <div className="is-size-7 has-text-grey">
                            {new Date(item.pubDate).toLocaleString()}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4">
                  <a
                    className="button is-link is-light"
                    href="https://discourse.nofeed.zone/?utm_source=app&utm_medium=community_page&utm_campaign=community"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Community Forum
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CommunityPage;


