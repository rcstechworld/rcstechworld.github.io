import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import "./styles.css";

const SHEET_URL ="https://docs.google.com/spreadsheets/d/e/2PACX-1vTIHC0Ww4wCdi7Tx5Xqhye4ljZ5nsM849ghAxvdNMr2Fp3iV5pcO6HGA1oQeePNx4mJd8KALMIyrglx/pub?output=csv";

const FALLBACK =
  "https://cdn.pixabay.com/photo/2014/05/02/21/50/laptop-336369_1280.jpg";

const img = (url) =>
  String(url || "")
    .trim()
    .replace("https://github.com/", "https://raw.githubusercontent.com/")
    .replace("/blob/", "/")
    .replace("?raw=true", "") || FALLBACK;

const val = (value) => String(value ?? "").trim();

function Card({ p, onZoom }) {
  const msg = encodeURIComponent(
    `Hello RCS TECH WORLD,\n\nI am interested in:\n\nProduct: ${p.brand} ${p.model}\nSKU: ${p.sku}\nPrice: ₹${p.price}`
  );

  return (
    <article className="product-card">
      <div className="product-top">
        <div
          className={
            "condition-badge " +
            (p.condition.toLowerCase() === "brand new"
              ? "brand-new"
              : "refurbished")
          }
        >
          {p.condition}
        </div>

        <button
          className="zoom-btn"
          type="button"
          onClick={() => onZoom(p.image)}
          aria-label="Zoom image"
        >
          ⌕
        </button>

        <div className="product-image">
          <img
            src={p.image}
            alt={`${p.brand} ${p.model}`}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK;
            }}
          />
        </div>
      </div>

      <div className="product-info">
        <h3>
          {p.brand} {p.model}
        </h3>

        <div className="price">₹{p.price || "Contact for price"}</div>

        <div className="stock">🔥 {p.stock || "Only Few Left"}</div>

        <div className="warranty-box">
          🛡 {p.warranty || "Warranty available"}
        </div>

        <table className="spec-table">
          <tbody>
            <tr>
              <td>Processor</td>
              <td>{p.processor || "—"}</td>
            </tr>
            <tr>
              <td>RAM</td>
              <td>{p.ram || "—"}</td>
            </tr>
            <tr>
              <td>Storage</td>
              <td>{p.ssd || "—"}</td>
            </tr>
            <tr>
              <td>Screen</td>
              <td>{p.screen || "—"}</td>
            </tr>
            <tr>
              <td>OS</td>
              <td>{p.os || "—"}</td>
            </tr>
            <tr>
              <td>SKU</td>
              <td>{p.sku}</td>
            </tr>
          </tbody>
        </table>

        <ul className="feature-list">
          <li>Battery & Adapter Covered</li>
          <li>Pan India Support</li>
        </ul>

        <a
          className="btn buy-btn"
          href={`https://wa.me/918168411895?text=${msg}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy Now
        </a>
      </div>
    </article>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [warranty, setWarranty] = useState("");
  const [condition, setCondition] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(null);
  const [modal, setModal] = useState("");

  const load = () => {
  setLoading(true);
  setError("");

  const freshURL = `${SHEET_URL}&cache=${Date.now()}`;

  Papa.parse(freshURL, {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: (results) => {
      console.log("Google Sheet Data:", results.data);
      console.log("Google Sheet Headers:", results.meta.fields);

      const seen = new Set();

      const data = (results.data || [])
        .map((p) => ({
          condition: val(p.Condition) || "Refurbished",
          brand: val(p.Brand),
          model: val(p.Model),
          processor: val(p.Processor),
          ram: val(p.RAM),
          ssd: val(p["HDD/SSD"]),
          screen: val(p.Screen),
          price: val(p["Base Price"]) || val(p.Price),
          sku: val(p.SKU) || val(p.sku),

          image:
            img(p["Image URL"]),

          os: val(p.OS) || "Windows Pro",
          warranty: val(p.Warranty),
          stock: val(p.Stock) || "Only Few Left",
        }))
        .filter((p) => {
          if (!p.sku || seen.has(p.sku)) return false;

          seen.add(p.sku);
          return true;
        });

      setProducts(data);
      setUpdated(new Date());
      setLoading(false);

      if (!data.length) {
        setError(
          "Google Sheet loaded, but no products with SKU were found."
        );
      }
    },

    error: (error) => {
      console.error("Google Sheet Error:", error);

      setLoading(false);
      setError(
        "Unable to load live stock from Google Sheet."
      );
    },
  });
};

  useEffect(() => {
    load();

    const timer = setInterval(load, 30000);

    return () => clearInterval(timer);
  }, []);

    const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return products.filter((p) => {
      const haystack = [
        p.brand,
        p.model,
        p.processor,
        p.ram,
        p.ssd,
        p.screen,
        p.sku,
        p.os,
      ]
        .join(" ")
        .toLowerCase();

      const warrantyText = (p.warranty || "").toLowerCase().trim();
      const conditionText = (p.condition || "").toLowerCase().trim();

      const matchesSearch = !q || haystack.includes(q);

      const matchesWarranty =
        !warranty ||
        (warranty === "1 month warranty" &&
          warrantyText.includes("1 month")) ||
        (warranty === "6 months warranty" &&
          warrantyText.includes("6 month")) ||
        (warranty === "1 year warranty" &&
          warrantyText.includes("1 year")) ||
        (warranty === "3 years warranty" &&
          warrantyText.includes("3 year"));

      const matchesCondition =
        !condition ||
        (condition === "brand new" &&
          conditionText.includes("brand new")) ||
        (condition === "refurbished" &&
          conditionText.includes("refurbished"));

      return matchesSearch && matchesWarranty && matchesCondition;
    });
  }, [products, search, warranty, condition]);

  return (
    <>
      <nav>
        <div className="logo-wrap">
          <div className="logo-mark">RCS</div>
          <div>
            <div className="logo-title">RCS TECH WORLD</div>
            <div className="logo-sub">LAPTOPS · DESKTOPS · UPGRADES</div>
          </div>
        </div>

        <div className="nav-links">
          <a href="#products">Products</a>
          <a href="#contact">Contact</a>
          <a href="tel:+918168411895">+91 8168411895</a>
          <a
            className="enquire"
            href="https://wa.me/918168411895"
            target="_blank"
            rel="noopener noreferrer"
          >
            ◯&nbsp; Enquire
          </a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="eyebrow">RCS TECH WORLD · DELHI</div>

            <h1>
              Quality laptops.
              <br />
              <span>Clear pricing.</span>
              <br />
              Trusted support.
            </h1>

            <p>
              Buy premium Brand New and Refurbished laptops, desktops and
              accessories with warranty and pan India support.
            </p>

            <div className="hero-actions">
              <a className="btn btn-primary" href="#products">
                View Available Stock
              </a>

              <a
                className="btn btn-secondary"
                href="https://wa.me/918168411895"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp Us
              </a>
            </div>
          </div>

          <div className="hero-photo">
            <img
              src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1200&auto=format&fit=crop"
              alt="Laptop"
            />
          </div>
        </div>
      </section>

      <section id="products" className="products-section">
        <div className="container">
          <h2 className="section-title">Available stock</h2>

          <p className="section-subtitle">
            Search live inventory, then filter by warranty and condition.
          </p>

          <div className="search-box">
            <span className="search-icon">⌕</span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by model, brand, processor, RAM..."
            />
          </div>

          <div className="filters">
            <div className="filter-row">
              <span className="filter-label">Warranty</span>

              {[
                ["", "All"],
                ["1 month warranty", "1 Month"],
                ["6 months warranty", "6 Months"],
                ["1 year warranty", "1 Year"],
                ["3 years warranty", "3 Years"],
              ].map(([value, label]) => (
                <button
                  key={label}
                  className={`filter-btn ${
                    warranty === value ? "active" : ""
                  }`}
                  onClick={() => setWarranty(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="filter-row">
              <span className="filter-label">Condition</span>

              {[
                ["", "All"],
                ["brand new", "Brand New"],
                ["refurbished", "Refurbished"],
              ].map(([value, label]) => (
                <button
                  key={label}
                  className={`filter-btn ${
                    condition === value ? "active" : ""
                  }`}
                  onClick={() => setCondition(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="stock-toolbar">
            <div className="count">
              {loading
                ? "Loading live stock..."
                : `${filtered.length} ${
                    filtered.length === 1 ? "device" : "devices"
                  } found`}

              {updated && !loading && (
                <small> · Updated {updated.toLocaleTimeString()}</small>
              )}
            </div>

            <button
              className="filter-btn"
              onClick={load}
              disabled={loading}
            >
              {loading ? "↻ Loading..." : "↻ Refresh Stock"}
            </button>
          </div>

          <div className="products">
            {loading && (
              <div className="loading">
                Loading live stock from Google Sheet…
              </div>
            )}

            {!loading && error && <div className="empty">{error}</div>}

            {!loading && !error && !filtered.length && (
              <div className="empty">
                No products found for the selected filters.
              </div>
            )}

            {!loading &&
              !error &&
              filtered.map((p) => (
                <Card key={p.sku} p={p} onZoom={setModal} />
              ))}
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <h2 className="section-title">About RCS TECH WORLD</h2>

          <p className="section-subtitle">
            Reliable devices, clear pricing and practical support.
          </p>

          <div className="about-box">
            <p>
              RCS TECH WORLD provides premium quality Brand New and Refurbished
              laptops, desktops and accessories with warranty and pan India
              support.
            </p>

            <br />

            <p>
              We deal in Dell, HP, Lenovo and business-class systems for
              students, professionals and businesses.
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="container">
          <div className="contact-card">
            <h2>Need help choosing a laptop?</h2>

            <p>
              <strong>RCS TECH WORLD</strong>
            </p>

            <p>RR-2 Vipin Garden, Uttam Nagar, New Delhi - 110059</p>

            <p>📞 +91 8168411895 · 011-49933556</p>

            <p>🕒 Monday - Sunday: 10AM - 9PM</p>

            <br />

            <a
              className="btn btn-primary"
              href="https://wa.me/918168411895"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer>© 2026 RCS TECH WORLD | All Rights Reserved</footer>

      <a
        className="whatsapp-float"
        href="https://wa.me/918168411895"
        target="_blank"
        rel="noopener noreferrer"
      >
        ◯ WhatsApp us
      </a>

      {modal && (
        <div className="image-modal" onClick={() => setModal("")}>
          <button
            className="close-modal"
            onClick={() => setModal("")}
            type="button"
          >
            ×
          </button>

          <img
            src={modal}
            alt="Product"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
