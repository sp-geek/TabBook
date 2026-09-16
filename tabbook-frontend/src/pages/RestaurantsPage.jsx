import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listRestaurants } from '../api/restaurants';

const PRICE_TIERS = [
  { label: 'Under ₹200', test: (p) => p < 200 },
  { label: '₹200–₹500', test: (p) => p >= 200 && p <= 500 },
  { label: 'Over ₹500', test: (p) => p > 500 },
];

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState(null);
  const [city, setCity] = useState(null);
  const [priceTier, setPriceTier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listRestaurants()
      .then(setRestaurants)
      .finally(() => setLoading(false));
  }, []);

  const cuisines = useMemo(
    () => [...new Set(restaurants.map((r) => r.cuisine).filter(Boolean))].sort(),
    [restaurants]
  );
  const cities = useMemo(
    () => [...new Set(restaurants.map((r) => r.city).filter(Boolean))].sort(),
    [restaurants]
  );

  const filtered = useMemo(
    () =>
      restaurants.filter((r) => {
        const matchesSearch = `${r.name} ${r.cuisine || ''} ${r.address} ${r.city || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesCuisine = !cuisine || r.cuisine === cuisine;
        const matchesCity = !city || r.city === city;
        const matchesPrice = !priceTier || priceTier.test(r.bookingPrice ?? 100);
        return matchesSearch && matchesCuisine && matchesCity && matchesPrice;
      }),
    [restaurants, search, cuisine, city, priceTier]
  );

  const featured = restaurants[0];
  const anyFilterActive = cuisine || city || priceTier;

  function clearFilters() {
    setCuisine(null);
    setCity(null);
    setPriceTier(null);
  }

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Dining plans, sorted.</p>
          <h1>
            Your next great meal is <em>closer</em> than you think.
          </h1>
          <p className="lede">
            Discover tables worth dressing up for. Pick a time, pick a table on the floor plan, and
            pay in a few taps — no phone calls.
          </p>
          <div className="search">
            <span>&#8981;</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cuisine, restaurant or area"
            />
          </div>
          <div className="proof">
            <span><span>&#10003;</span>Instant confirmation</span>
            <span><span>&#9689;</span>No phone calls</span>
          </div>
        </div>
        {featured ? (
          <Link to={`/restaurants/${featured.id}`} className="hero-image">
            <img src={featured.images?.[0]?.url || '/placeholder.svg'} alt="" />
            <span className="hero-arrow">&#8594;</span>
            <div>
              <small>TONIGHT&apos;S PICK</small>
              <h2>{featured.name}</h2>
              <p>{featured.cuisine || featured.address}</p>
            </div>
          </Link>
        ) : (
          <div className="hero-image">
            <img src="/placeholder.svg" alt="" />
          </div>
        )}
      </section>

      <section className="places">
        <p className="eyebrow">For your table</p>
        <h2>Places taking bookings</h2>

        <div className="filter-bar">
          {cities.length > 0 && (
            <div className="filter-group">
              <span className="filter-label">Location</span>
              <div className="pills">
                {cities.map((c) => (
                  <button
                    key={c}
                    className={city === c ? 'selected' : ''}
                    onClick={() => setCity(city === c ? null : c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {cuisines.length > 0 && (
            <div className="filter-group">
              <span className="filter-label">Cuisine</span>
              <div className="pills">
                {cuisines.map((c) => (
                  <button
                    key={c}
                    className={cuisine === c ? 'selected' : ''}
                    onClick={() => setCuisine(cuisine === c ? null : c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="filter-group">
            <span className="filter-label">Price</span>
            <div className="pills">
              {PRICE_TIERS.map((tier) => (
                <button
                  key={tier.label}
                  className={priceTier?.label === tier.label ? 'selected' : ''}
                  onClick={() => setPriceTier(priceTier?.label === tier.label ? null : tier)}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {anyFilterActive && (
            <button className="ghost-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {loading && <p style={{ color: '#6f7872' }}>Loading…</p>}
        {!loading && filtered.length === 0 && (
          <div className="empty">No restaurants match your search yet.</div>
        )}

        <div className="cards">
          {filtered.map((r) => (
            <Link className="card" to={`/restaurants/${r.id}`} key={r.id}>
              <img src={r.images?.[0]?.url || '/placeholder.svg'} alt={r.name} />
              <div className="card-body">
                <h3>{r.name}</h3>
                <p>
                  {r.cuisine || 'Restaurant'}
                  {r.city ? ` · ${r.city}` : ''}
                </p>
                <small>
                  &#8982; {r.address} · {r.openTime}–{r.closeTime} · ₹{r.bookingPrice ?? 100}/guest
                </small>
                <span className="cta">Find a table →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}