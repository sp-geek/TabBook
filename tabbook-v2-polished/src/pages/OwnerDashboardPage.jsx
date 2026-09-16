import { useEffect, useMemo, useState } from 'react';
import {
  listRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantBookings,
  uploadRestaurantImage,
  deleteRestaurantImage,
} from '../api/restaurants';
import { listTables, createTable, updateTablePosition } from '../api/tables';
import { useAuth } from '../context/AuthContext';
import TableCanvas from '../components/TableCanvas';

const emptyRestaurant = {
  name: '',
  address: '',
  city: '',
  cuisine: '',
  description: '',
  bookingPrice: 100,
  openTime: '10:00',
  closeTime: '23:00',
  slotMinutes: 60,
};
const emptyTable = { label: '', capacity: '', area: 'Main Floor' };

function toFormState(r) {
  return {
    name: r.name || '',
    address: r.address || '',
    city: r.city || '',
    cuisine: r.cuisine || '',
    description: r.description || '',
    bookingPrice: r.bookingPrice ?? 100,
    openTime: r.openTime || '',
    closeTime: r.closeTime || '',
    slotMinutes: r.slotMinutes ?? 60,
  };
}

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [myRestaurants, setMyRestaurants] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedArea, setSelectedArea] = useState('Main Floor');
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('floorplan'); // 'floorplan' | 'bookings'

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurant);
  const [creatingRestaurant, setCreatingRestaurant] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editForm, setEditForm] = useState(emptyRestaurant);
  const [savingDetails, setSavingDetails] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState('');

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  const [tableForm, setTableForm] = useState(emptyTable);
  const [creatingTable, setCreatingTable] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const selectedRestaurant = useMemo(
    () => myRestaurants.find((r) => r.id === selectedId) || null,
    [myRestaurants, selectedId]
  );

  function loadRestaurants(preserveSelection = true) {
    setLoading(true);
    return listRestaurants()
      .then((all) => {
        const mine = all.filter((r) => r.ownerId === user.id);
        setMyRestaurants(mine);
        if (mine.length === 0) {
          setSelectedId(null);
          setShowCreateForm(true);
        } else if (!preserveSelection || !mine.some((r) => r.id === selectedId)) {
          setSelectedId(mine[0].id);
        }
        return mine;
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadRestaurants(false); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      setEditForm(toFormState(selectedRestaurant));
      setDetailsMsg('');
    }
  }, [selectedRestaurant]);

  function reloadTables() {
    if (!selectedId) return;
    listTables(selectedId).then(setTables);
  }

  useEffect(() => {
    reloadTables();
    setSubTab('floorplan');
    setBookings([]);
    /* eslint-disable-next-line */
  }, [selectedId]);

  const areas = useMemo(() => {
    const set = new Set(tables.map((t) => t.area || 'Main Floor'));
    set.add(tableForm.area || 'Main Floor');
    return [...set];
  }, [tables, tableForm.area]);

  const tablesInArea = useMemo(
    () => tables.filter((t) => (t.area || 'Main Floor') === selectedArea),
    [tables, selectedArea]
  );

  async function handleCreateRestaurant(e) {
    e.preventDefault();
    setCreatingRestaurant(true);
    setCreateError('');
    try {
      const created = await createRestaurant({
        ...restaurantForm,
        bookingPrice: Number(restaurantForm.bookingPrice),
        slotMinutes: Number(restaurantForm.slotMinutes),
      });
      setRestaurantForm(emptyRestaurant);
      setShowCreateForm(false);
      await loadRestaurants(false);
      setSelectedId(created.id);
    } catch (err) {
      setCreateError(err.response?.data?.error || err.message || 'Failed to create restaurant');
    } finally {
      setCreatingRestaurant(false);
    }
  }

  async function handleSaveDetails(e) {
    e.preventDefault();
    if (!selectedId) return;
    setSavingDetails(true);
    setDetailsMsg('');
    try {
      await updateRestaurant(selectedId, {
        ...editForm,
        bookingPrice: Number(editForm.bookingPrice),
        slotMinutes: Number(editForm.slotMinutes),
      });
      await loadRestaurants();
      setDetailsMsg('Saved.');
    } catch (err) {
      setDetailsMsg(err.response?.data?.error || err.message || 'Failed to save changes');
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleDeleteRestaurant() {
    if (!selectedId || !selectedRestaurant) return;
    if (!window.confirm(`Delete "${selectedRestaurant.name}"? This can't be undone from here.`)) return;
    setDeleting(true);
    try {
      await deleteRestaurant(selectedId);
      await loadRestaurants(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    setUploadingImage(true);
    setImageError('');
    try {
      await uploadRestaurantImage(selectedId, file);
      await loadRestaurants();
    } catch (err) {
      setImageError(err.response?.data?.error || err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  async function handleImageDelete(imageId) {
    if (!selectedId) return;
    try {
      await deleteRestaurantImage(selectedId, imageId);
      await loadRestaurants();
    } catch (err) {
      setImageError(err.response?.data?.error || err.message || 'Failed to delete image');
    }
  }

  async function handleCreateTable(e) {
    e.preventDefault();
    if (!selectedId) return;
    setCreatingTable(true);
    try {
      const sameArea = tables.filter((t) => (t.area || 'Main Floor') === tableForm.area);
      await createTable(selectedId, {
        label: tableForm.label,
        capacity: Number(tableForm.capacity),
        area: tableForm.area || 'Main Floor',
        posX: 20 + sameArea.length * 90,
        posY: 20,
      });
      setSelectedArea(tableForm.area || 'Main Floor');
      setTableForm({ ...emptyTable, area: tableForm.area });
      reloadTables();
    } finally {
      setCreatingTable(false);
    }
  }

  function handlePositionChange(tableId, { posX, posY }) {
    updateTablePosition(selectedId, tableId, { posX, posY });
  }

  function handleShowBookings() {
    setSubTab('bookings');
    if (!selectedId) return;
    setBookingsLoading(true);
    getRestaurantBookings(selectedId)
      .then(setBookings)
      .finally(() => setBookingsLoading(false));
  }

  if (loading) return <main className="content"><p style={{ color: '#6f7872' }}>Loading…</p></main>;

  return (
    <main className="content">
      <p className="eyebrow">Restaurant dashboard</p>
      <h1 style={{ fontSize: 44 }}>Good to see you, {user?.name}.</h1>

      {myRestaurants.length > 0 && (
        <div className="restaurant-tabs">
          {myRestaurants.map((r) => (
            <button
              key={r.id}
              className={selectedId === r.id && !showCreateForm ? 'selected' : ''}
              onClick={() => { setSelectedId(r.id); setShowCreateForm(false); }}
            >
              {r.name}
            </button>
          ))}
          <button
            className={showCreateForm ? 'selected' : ''}
            onClick={() => setShowCreateForm((v) => !v)}
          >
            + Add restaurant
          </button>
        </div>
      )}

      {(myRestaurants.length === 0 || showCreateForm) && (
        <div className="panel" style={{ maxWidth: 460, marginBottom: 40 }}>
          <h3>List your restaurant</h3>
          <form onSubmit={handleCreateRestaurant}>
            <input className="field" placeholder="Name" required
              value={restaurantForm.name}
              onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })} />
            <input className="field" placeholder="Address" required
              value={restaurantForm.address}
              onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })} />
            <input className="field" placeholder="City (e.g. Una, Bengaluru)"
              value={restaurantForm.city}
              onChange={(e) => setRestaurantForm({ ...restaurantForm, city: e.target.value })} />
            <input className="field" placeholder="Cuisine (optional)"
              value={restaurantForm.cuisine}
              onChange={(e) => setRestaurantForm({ ...restaurantForm, cuisine: e.target.value })} />
            <textarea className="field" placeholder="Description (optional)" rows={3}
              value={restaurantForm.description}
              onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })} />
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="field" placeholder="Open (HH:MM)" required
                value={restaurantForm.openTime}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, openTime: e.target.value })} />
              <input className="field" placeholder="Close (HH:MM)" required
                value={restaurantForm.closeTime}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, closeTime: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="field" type="number" min="1" placeholder="Slot mins" required
                value={restaurantForm.slotMinutes}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, slotMinutes: e.target.value })} />
              <input className="field" type="number" min="0" step="0.01" placeholder="Price per guest (₹)" required
                value={restaurantForm.bookingPrice}
                onChange={(e) => setRestaurantForm({ ...restaurantForm, bookingPrice: e.target.value })} />
            </div>
            {createError && <p className="error-text">{createError}</p>}
            <button className="primary" style={{ width: '100%' }} disabled={creatingRestaurant}>
              {creatingRestaurant ? 'Creating…' : 'Create restaurant'}
            </button>
            {myRestaurants.length > 0 && (
              <button
                type="button"
                className="ghost-btn"
                style={{ width: '100%', marginTop: 10 }}
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      )}

      {selectedId && selectedRestaurant && !showCreateForm && (
        <>
          <div className="owner-grid" style={{ marginBottom: 40 }}>
            <div className="panel">
              <h3>Restaurant details</h3>
              <form onSubmit={handleSaveDetails}>
                <input className="field" placeholder="Name" required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <input className="field" placeholder="Address" required
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                <input className="field" placeholder="City"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                <input className="field" placeholder="Cuisine"
                  value={editForm.cuisine}
                  onChange={(e) => setEditForm({ ...editForm, cuisine: e.target.value })} />
                <textarea className="field" placeholder="Description" rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <input className="field" placeholder="Open (HH:MM)" required
                    value={editForm.openTime}
                    onChange={(e) => setEditForm({ ...editForm, openTime: e.target.value })} />
                  <input className="field" placeholder="Close (HH:MM)" required
                    value={editForm.closeTime}
                    onChange={(e) => setEditForm({ ...editForm, closeTime: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input className="field" type="number" min="1" placeholder="Slot mins" required
                    value={editForm.slotMinutes}
                    onChange={(e) => setEditForm({ ...editForm, slotMinutes: e.target.value })} />
                  <input className="field" type="number" min="0" step="0.01" placeholder="Price per guest (₹)" required
                    value={editForm.bookingPrice}
                    onChange={(e) => setEditForm({ ...editForm, bookingPrice: e.target.value })} />
                </div>
                {detailsMsg && (
                  <p className={detailsMsg === 'Saved.' ? 'hint' : 'error-text'}>{detailsMsg}</p>
                )}
                <button className="primary" style={{ width: '100%' }} disabled={savingDetails}>
                  {savingDetails ? 'Saving…' : 'Save changes'}
                </button>
              </form>
              <button
                className="ghost-btn"
                style={{ width: '100%', marginTop: 14, color: '#c1462f' }}
                disabled={deleting}
                onClick={handleDeleteRestaurant}
              >
                {deleting ? 'Deleting…' : 'Delete this restaurant'}
              </button>
            </div>

            <div className="panel">
              <h3>Photo gallery</h3>
              <p className="hint" style={{ marginTop: 0 }}>
                Add photos customers will see on your restaurant's page.
              </p>
              <div className="photo-grid">
                {(selectedRestaurant.images || [])
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((img) => (
                    <div className="photo-thumb" key={img.id}>
                      <img src={img.url} alt="" />
                      <button
                        type="button"
                        className="photo-remove"
                        onClick={() => handleImageDelete(img.id)}
                        title="Remove photo"
                      >
                        &#10005;
                      </button>
                    </div>
                  ))}
                <label className="photo-upload">
                  {uploadingImage ? 'Uploading…' : '+ Add photo'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={uploadingImage}
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              {imageError && <p className="error-text">{imageError}</p>}
            </div>
          </div>

          <div className="tabs" style={{ marginBottom: 20 }}>
            <button
              className={subTab === 'floorplan' ? 'selected' : ''}
              onClick={() => setSubTab('floorplan')}
            >
              Floor plan
            </button>
            <button
              className={subTab === 'bookings' ? 'selected' : ''}
              onClick={handleShowBookings}
            >
              Bookings
            </button>
          </div>

          {subTab === 'floorplan' && (
            <div className="owner-grid">
              <div className="panel">
                <h3>Add a table</h3>
                <form onSubmit={handleCreateTable}>
                  <input className="field" placeholder="Label (e.g. T1)" required
                    value={tableForm.label}
                    onChange={(e) => setTableForm({ ...tableForm, label: e.target.value })} />
                  <input className="field" type="number" placeholder="Capacity" required
                    value={tableForm.capacity}
                    onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })} />
                  <input className="field" placeholder="Area (e.g. Main Floor, Open Roof)"
                    value={tableForm.area}
                    onChange={(e) => setTableForm({ ...tableForm, area: e.target.value })} />
                  <button className="primary" style={{ width: '100%' }} disabled={creatingTable}>
                    {creatingTable ? 'Adding…' : 'Add table'}
                  </button>
                </form>
                <p className="hint">
                  Drag tables on the floor plan to arrange them — positions save automatically. Give
                  tables a different "Area" name (like "Open Roof") to create a new floor.
                </p>
              </div>

              <div>
                {areas.length > 1 && (
                  <div className="tabs" style={{ marginBottom: 12 }}>
                    {areas.map((a) => (
                      <button key={a} className={selectedArea === a ? 'selected' : ''} onClick={() => setSelectedArea(a)}>
                        {a}
                      </button>
                    ))}
                  </div>
                )}
                <h3 style={{ fontFamily: "'Space Grotesk'", marginTop: 0 }}>{selectedArea} — floor plan</h3>
                <TableCanvas tables={tablesInArea} mode="edit" onPositionChange={handlePositionChange} />
              </div>
            </div>
          )}

          {subTab === 'bookings' && (
            <div>
              {bookingsLoading && <p style={{ color: '#6f7872' }}>Loading bookings…</p>}
              {!bookingsLoading && bookings.length === 0 && (
                <div className="empty">No bookings for this restaurant yet.</div>
              )}
              {!bookingsLoading &&
                bookings.map((b) => (
                  <div className="booking-row" key={b.id}>
                    <div>
                      <strong style={{ fontFamily: "'Space Grotesk'", fontSize: 17 }}>
                        {new Date(b.date).toLocaleDateString(undefined, { dateStyle: 'medium' })} · {b.slotStart}–{b.slotEnd}
                      </strong>
                      <p style={{ color: '#6f7872', margin: '4px 0 0' }}>
                        Table #{b.tableId} · {b.guests} guest{b.guests === 1 ? '' : 's'}
                        {b.customer ? ` · ${b.customer.name} (${b.customer.email})` : ''}
                      </p>
                      {b.notes && (
                        <p style={{ color: '#6f7872', margin: '4px 0 0', fontStyle: 'italic' }}>
                          "{b.notes}"
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {b.payment && (
                        <span className={`badge ${b.payment.status === 'SUCCESS' ? 'CONFIRMED' : b.payment.status === 'REFUNDED' ? 'CANCELLED' : 'PENDING'}`}>
                          {b.payment.status}
                        </span>
                      )}
                      <span className={`badge ${b.status}`}>{b.status}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
