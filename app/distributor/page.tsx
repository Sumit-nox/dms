"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function DistributorDashboard() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [retailers, setRetailers] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [routeId, setRouteId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: routesData } = await supabase
      .from("routes")
      .select("*")
      .order("id");

    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .order("id");

    const { data: retailersData } = await supabase
      .from("retailers")
      .select(
        `
        *,
        routes(name)
      `
      )
      .order("id");

    setRoutes(routesData || []);
    setProducts(productsData || []);
    setRetailers(retailersData || []);
  }

  async function addRetailer() {
    if (!name || !phone || !address || !routeId) {
      alert("Please fill all fields");
      return;
    }

    const { error } = await supabase.from("retailers").insert([
      {
        name,
        phone,
        address,
        route_id: Number(routeId),
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setPhone("");
    setAddress("");
    setRouteId("");

    await loadData();

    alert("Retailer added successfully");
  }

  async function deleteRetailer(id: number) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this retailer?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("retailers")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();

    alert("Retailer deleted successfully");
  }

  return (
    <main className="p-8 text-white bg-black min-h-screen">
      <h1 className="text-4xl font-bold mb-8">
        Distributor Dashboard
      </h1>

      {/* Routes + Products */}
      <div className="grid grid-cols-2 gap-10 mb-12">
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Routes
          </h2>

          {routes.map((route) => (
            <div
              key={route.id}
              className="border p-4 rounded mb-3"
            >
              {route.name}
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">
            Products
          </h2>

          {products.map((product) => (
            <div
              key={product.id}
              className="border p-4 rounded mb-3"
            >
              {product.name}
            </div>
          ))}
        </div>
      </div>

      {/* Add Retailer */}
      <div className="border p-6 rounded mb-10">
        <h2 className="text-2xl font-bold mb-4">
          Add Retailer
        </h2>

        <div className="space-y-4">
          <input
            className="w-full p-2 bg-white text-black border rounded"
            placeholder="Retailer Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="w-full p-2 bg-white text-black border rounded"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            className="w-full p-2 bg-white text-black border rounded"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <select
            className="w-full p-2 bg-white text-black border rounded"
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
          >
            <option value="">
              Select Route
            </option>

            {routes.map((route) => (
              <option
                key={route.id}
                value={route.id}
              >
                {route.name}
              </option>
            ))}
          </select>

          <button
            onClick={addRetailer}
            className="bg-white text-black px-4 py-2 rounded"
          >
            Add Retailer
          </button>
        </div>
      </div>

      {/* Retailers */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Retailers
        </h2>

        {retailers.length === 0 ? (
          <p>No retailers found.</p>
        ) : (
          retailers.map((retailer) => (
            <div
              key={retailer.id}
              className="border p-4 rounded mb-3"
            >
              <div>
                <strong>{retailer.name}</strong>
              </div>

              <div>{retailer.phone}</div>

              <div>{retailer.address}</div>

              <div>
                Route: {retailer.routes?.name}
              </div>

              <button
                onClick={() =>
                  deleteRetailer(retailer.id)
                }
                className="mt-3 bg-red-600 px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}