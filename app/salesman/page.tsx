"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function SalesmanPage() {
const [name, setName] = useState("");
const [routes, setRoutes] = useState<any[]>([]);
const [retailers, setRetailers] = useState<any[]>([]);
const [products, setProducts] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
loadDashboard();
}, []);

async function loadDashboard() {
const {
data: { user },
} = await supabase.auth.getUser();


console.log("USER:", user);

if (!user) {
  setLoading(false);
  return;
}

const { data: salesman, error: salesmanError } = await supabase
  .from("salesmen")
  .select("*")
  .eq("profile_id", user.id)
  .single();

console.log("SALESMAN:", salesman);
console.log("SALESMAN ERROR:", salesmanError);

if (!salesman) {
  setLoading(false);
  return;
}

setName(salesman.name);

const { data: routeLinks, error: routeLinksError } = await supabase
  .from("salesman_routes")
  .select("route_id")
  .eq("salesman_id", salesman.id);

console.log("ROUTE LINKS:", routeLinks);
console.log("ROUTE LINKS ERROR:", routeLinksError);

const routeIds = routeLinks?.map((r) => r.route_id) || [];

console.log("ROUTE IDS:", routeIds);

if (routeIds.length > 0) {
  const { data: routeData, error: routeError } = await supabase
    .from("routes")
    .select("*")
    .in("id", routeIds);

  console.log("ROUTES:", routeData);
  console.log("ROUTES ERROR:", routeError);

  setRoutes(routeData || []);

  const { data: retailerData, error: retailerError } = await supabase
    .from("retailers")
    .select("*")
    .in("route_id", routeIds);

  console.log("RETAILERS:", retailerData);
  console.log("RETAILERS ERROR:", retailerError);

  setRetailers(retailerData || []);
}

const { data: productData, error: productError } = await supabase
  .from("products")
  .select("*");

console.log("PRODUCTS:", productData);
console.log("PRODUCTS ERROR:", productError);

setProducts(productData || []);

setLoading(false);


}

if (loading) {
return ( <main className="p-8">
Loading... </main>
);
}

return ( <main className="p-8 max-w-4xl mx-auto"> <h1 className="text-3xl font-bold mb-6">
Welcome {name} </h1>


  <div className="grid gap-6">
    <section className="border p-4 rounded">
      <h2 className="font-bold text-xl mb-3">
        My Routes
      </h2>

      {routes.map((route) => (
        <div key={route.id}>
          {route.name}
        </div>
      ))}
    </section>

    <section className="border p-4 rounded">
      <h2 className="font-bold text-xl mb-3">
        Retailers on My Routes
      </h2>

      {retailers.map((retailer) => (
        <div key={retailer.id}>
          {retailer.name}
        </div>
      ))}
    </section>

    <section className="border p-4 rounded">
      <h2 className="font-bold text-xl mb-3">
        Available Products
      </h2>

      {products.map((product) => (
        <div key={product.id}>
          {product.name} - ₹{product.price}
        </div>
      ))}
    </section>
  </div>
</main>


);
}
