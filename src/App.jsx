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

function Card({ p, onZoom, onEnquire }) {
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

        <div
          className="product-image"
          role="button"
          tabIndex={0}
          onClick={() => onZoom(p.image)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onZoom(p.image);
          }}
          title="Click to zoom"
        >
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
        <h3>{p.brand} {p.model}</h3>
        <div className="price">₹{p.price || "Contact for price"}</div>
        <div className="stock">🔥 {p.stock || "Only Few Left"}</div>

        <div className="warranty-box">
          🛡 {p.warranty || "Warranty available"}
        </div>

        <table className="spec-table">
          <tbody>
            <tr><td>Processor</td><td>{p.processor || "—"}</td></tr>
            <tr><td>RAM</td><td>{p.ram || "—"}</td></tr>
            <tr><td>Storage</td><td>{p.ssd || "—"}</td></tr>
            <tr><td>Screen</td><td>{p.screen || "—"}</td></tr>
            <tr><td>OS</td><td>{p.os || "—"}</td></tr>
            <tr><td>SKU</td><td>{p.sku}</td></tr>
          </tbody>
        </table>

        <ul className="feature-list">
          <li>Battery & Adapter Covered</li>
          <li>Pan India Support</li>
        </ul>

        <div className="product-actions">
          <button
            className="btn enquire-btn"
            type="button"
            onClick={() => onEnquire(p)}
          >
            Enquire
          </button>

          <a
            className="btn buy-btn"
            href={`https://wa.me/918168411895?text=${msg}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy Now
          </a>
        </div>
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

  const [modal, setModal] = useState("");
  const [zoom, setZoom] = useState(1);

  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    message: "",
  });

  // Tawk.to live chat
  useEffect(() => {
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    if (
      document.querySelector(
        'script[src*="embed.tawk.to/5cece1a32135900bac12ccc2"]'
      )
    ) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src =
      "https://embed.tawk.to/5cece1a32135900bac12ccc2/default";
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.body.appendChild(script);
  }, []);

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
            image: img(p["Image URL"]),
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
        setLoading(false);

        if (!data.length) {
          setError("No products are currently available.");
        }
      },

      error: (error) => {
        console.error("Google Sheet Error:", error);
        setLoading(false);
        setError("Unable to load products right now. Please try again shortly.");
      },
    });
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
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

  const openImage = (src) => {
    setModal(src);
    setZoom(1);
  };

  const closeImage = () => {
    setModal("");
    setZoom(1);
  };

  const openEnquiry = (product = null) => {
    setSelectedProduct(product);
    setForm({
      name: "",
      mobile: "",
      email: "",
      message: product
        ? `I am interested in ${product.brand} ${product.model} (SKU: ${product.sku}). Please share availability and final price.`
        : "",
    });
    setEnquiryOpen(true);
  };

  const closeEnquiry = () => {
    setEnquiryOpen(false);
    setSelectedProduct(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitEnquiry = (e) => {
    e.preventDefault();

    const productText = selectedProduct
      ? `Product: ${selectedProduct.brand} ${selectedProduct.model}\nSKU: ${selectedProduct.sku}\nPrice: ₹${selectedProduct.price}`
      : "Product: General Enquiry";

    const text = encodeURIComponent(
      `Hello RCS TECH WORLD,\n\n${productText}\n\nName: ${form.name}\nMobile: ${form.mobile}\nEmail: ${form.email || "Not provided"}\n\nMessage:\n${form.message || "Please contact me regarding your laptop requirement."}`
    );

    window.open(
      `https://wa.me/918168411895?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );

    closeEnquiry();
  };

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

          <button
            className="enquire"
            type="button"
            onClick={() => openEnquiry()}
          >
            ●&nbsp; Enquire
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="eyebrow"> RCS TECH WORLD — Where Trust Never Dies. </div>

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

              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => openEnquiry()}
              >
                Enquire Now
              </button>
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
            Explore live inventory by brand, RAM, SSD, processor, and other configurations.
          </p>

          <div className="search-box">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder=""
              aria-label="Search products"
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
                  className={`filter-btn ${warranty === value ? "active" : ""}`}
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
                  className={`filter-btn ${condition === value ? "active" : ""}`}
                  onClick={() => setCondition(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="products">
            {!loading && error && <div className="empty">{error}</div>}

            {!loading && !error && !filtered.length && (
              <div className="empty">
                No products found for the selected filters.
              </div>
            )}

            {!loading &&
              !error &&
              filtered.map((p) => (
                <Card
                  key={p.sku}
                  p={p}
                  onZoom={openImage}
                  onEnquire={openEnquiry}
                />
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

            <button
              className="btn btn-primary"
              type="button"
              onClick={() => openEnquiry()}
            >
              Send Enquiry
            </button>
          </div>
        </div>
      </section>

      <footer>© 2026 RCS TECH WORLD | All Rights Reserved</footer>

      {modal && (
        <div className="image-modal" onClick={closeImage}>
          <button
            className="close-modal"
            onClick={closeImage}
            type="button"
            aria-label="Close image"
          >
            ×
          </button>

          <div
            className="image-zoom-wrap"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.preventDefault();
              setZoom((current) =>
                Math.min(3, Math.max(0.7, current + (e.deltaY < 0 ? 0.1 : -0.1)))
              );
            }}
          >
            <img
              src={modal}
              alt="Product"
              style={{
                transform: `scale(${zoom})`,
                transition: "transform 0.15s ease",
              }}
            />
          </div>

          <div
            className="image-controls"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>+</button>
            <button type="button" onClick={() => setZoom((z) => Math.max(0.7, z - 0.2))}>−</button>
            <button type="button" onClick={() => setZoom(1)}>Reset</button>
          </div>
        </div>
      )}

      {enquiryOpen && (
        <div className="enquiry-modal" onClick={closeEnquiry}>
          <div
            className="enquiry-box"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal enquiry-close"
              onClick={closeEnquiry}
              type="button"
              aria-label="Close enquiry"
            >
              ×
            </button>

            <div className="enquiry-header">
              <span>RCS TECH WORLD</span>
              <h2>Send Enquiry</h2>
              <p>
                {selectedProduct
                  ? `${selectedProduct.brand} ${selectedProduct.model}`
                  : "Tell us what laptop you are looking for."}
              </p>
            </div>

            <form onSubmit={submitEnquiry} className="enquiry-form">
  <label>
    Name *
    <input
      name="name"
      value={form.name}
      onChange={handleFormChange}
      required
      placeholder="Your name"
      autoComplete="name"
    />
  </label>

  <label>
    Mobile *
    <input
      name="mobile"
      value={form.mobile}
      onChange={handleFormChange}
      required
      inputMode="tel"
      autoComplete="tel"
      pattern="[0-9+() -]{10,}"
      placeholder="Your mobile number"
    />
  </label>

  <label>
    Email *
    <input
      name="email"
      type="email"
      value={form.email}
      onChange={handleFormChange}
      required
      autoComplete="email"
      placeholder="your@email.com"
    />
  </label>

  <label>
    Message
    <textarea
      name="message"
      value={form.message}
      onChange={handleFormChange}
      placeholder="What are you looking for?"
      rows="4"
    />
  </label>

  <button type="submit" className="btn enquiry-submit">
    Send on WhatsApp
  </button>
</form>
          </div>
        </div>
      )}
    </>
  );
}
