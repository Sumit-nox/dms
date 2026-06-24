
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function SalesmanPage() {
  const [salesman, setSalesman] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("USER:", user);

    if (!user) return;

    // Find salesman record
    const { data: salesmanData, error: salesmanError } = await supabase
      .from("salesmen")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    console.log("SALESMAN:", salesmanData);
    console.log("SALESMAN ERROR:", salesmanError);

    if (!salesmanData) return;

    setSalesman(salesmanData);

    // Find route assignments
    const { data: routeLinks, error: routeLinksError } = await supabase
      .from("salesman_routes")
      .select("*")
      .eq("salesman_id", salesmanData.id);

    console.log("ROUTE LINKS:", routeLinks);
    console.log("ROUTE LINKS ERROR:", routeLinksError);

    const routeIds =
      routeLinks?.map((link: any) => link.route_id) || [];

    console.log("ROUTE IDS:", routeIds);

    // Get routes
    if (routeIds.length > 0) {
      const { data: routesData, error: routesError } = await supabase
        .from("routes")
        .select("*")
        .in("id", routeIds);

      console.log("ROUTES:", routesData);
      console.log("ROUTES ERROR:", routesError);

      setRoutes(routesData || []);

      // Get retailers on these routes
      const { data: retailersData, error: retailersError } =
        await supabase
          .from("retailers")
          .select("*")
          .in("route_id", routeIds);

      console.log("RETAILERS:", retailersData);
      console.log("RETAILERS ERROR:", retailersError);

      setRetailers(retailersData || []);
    }

    // Get products
    const { data: productsData, error: productsError } =
      await supabase.from("products").select("*");

    console.log("PRODUCTS:", productsData);
    console.log("PRODUCTS ERROR:", productsError);

    setProducts(productsData || []);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            marginBottom: "20px",
          }}
        >
          Welcome {salesman?.name}
        </h1>

        {/* Dashboard Summary Cards */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              border: "1px solid white",
              padding: "15px",
              flex: 1,
              borderRadius: "8px",
            }}
          >
            <h3>Routes</h3>
            <p>{routes.length}</p>
          </div>

          <div
            style={{
              border: "1px solid white",
              padding: "15px",
              flex: 1,
              borderRadius: "8px",
            }}
          >
            <h3>Retailers</h3>
            <p>{retailers.length}</p>
          </div>

          <div
            style={{
              border: "1px solid white",
              padding: "15px",
              flex: 1,
              borderRadius: "8px",
            }}
          >
            <h3>Products</h3>
            <p>{products.length}</p>
          </div>
        </div>

        {/* Routes */}
        <div
          style={{
            border: "1px solid white",
            padding: "20px",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <h2>My Routes</h2>

          {routes.map((route: any) => (
            <p key={route.id}>{route.name}</p>
          ))}
        </div>

        {/* Retailers */}
        <div
          style={{
            border: "1px solid white",
            padding: "20px",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <h2>Retailers on My Routes</h2>

          {retailers.map((retailer: any) => (
            <div
              key={retailer.id}
              style={{
                border: "1px solid gray",
                padding: "12px",
                marginTop: "10px",
                borderRadius: "6px",
              }}
            >
              <h3>{retailer.name}</h3>

              <p>{retailer.phone}</p>

              <p>{retailer.address}</p>

              <button
                onClick={() =>
                  router.push(`/retailer/${retailer.id}`)
                }
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Visit Retailer
              </button>
            </div>
          ))}
        </div>

        {/* Products */}
        <div
          style={{
            border: "1px solid white",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <h2>Available Products</h2>

          {products.map((product: any) => (
            <p key={product.id}>
              {product.name} - ₹{product.price}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

