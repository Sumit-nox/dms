
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function RetailerPage() {
  const params = useParams();

  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any>({});
  const [retailer, setRetailer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadRetailer();
    loadProducts();
  }, [params.id]);

  async function loadRetailer() {
    const retailerId = params.id as string;

    const { data, error } = await supabase
      .from("retailers")
      .select("*")
      .eq("id", retailerId)
      .single();

    console.log("RETAILER:", data);
    console.log("RETAILER ERROR:", error);

    if (error) {
      console.error(error);
    }

    setRetailer(data);
    setLoading(false);
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id");

    console.log("PRODUCTS:", data);
    console.log("PRODUCTS ERROR:", error);

    setProducts(data || []);

    console.log("PRODUCT COUNT:", data?.length);
  }

  function increaseQty(productId: number) {
    setCart((prev: any) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  }

  function decreaseQty(productId: number) {
    setCart((prev: any) => ({
      ...prev,
      [productId]: Math.max((prev[productId] || 0) - 1, 0),
    }));
  }

  const totalAmount = products.reduce((total, product) => {
    const qty = cart[product.id] || 0;

    return total + qty * Number(product.price);
  }, 0);

  async function placeOrder() {
  try {
    setMessage("");

    // Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("User not logged in");
      return;
    }

    // Find salesman
    const { data: salesman } = await supabase
      .from("salesmen")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    if (!salesman) {
      setMessage("Salesman not found");
      return;
    }

    console.log("ORDER PAYLOAD:", {
  retailer_id: retailer.id,
  salesman_id: 1,
  route_id: retailer.route_id,
  status: "Pending",
  order_date: new Date().toISOString().split("T")[0],
});

    // Create order
   const { data: order, error: orderError } = await supabase
  .from("orders") .insert([
    {
      retailer_id: retailer.id,
      salesman_id: 1,
      route_id: retailer.route_id,
      status: "Pending",
      order_date: new Date().toISOString().split("T")[0],
    },
  ])
  .select()
  .single();
    if (orderError) {
      console.error(orderError);
      setMessage(orderError.message);
      return;
    }

    // Create order items
    const items = products
      .filter((product) => (cart[product.id] || 0) > 0)
      .map((product) => ({
        order_id: order.id,
        product_id: product.id,
        qty: cart[product.id],
        unit_price: product.price,
      }));

    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(items);

      if (itemsError) {
        console.error(itemsError);
        setMessage(itemsError.message);
        return;
      }
    }

    setCart({});
    setMessage("Order placed successfully!");

    console.log("ORDER:", order);
    console.log("ITEMS:", items);
  } catch (err) {
    console.error(err);
    setMessage("Unexpected error");
  }
}

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "black",
          color: "white",
          padding: "30px",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!retailer) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "black",
          color: "white",
          padding: "30px",
        }}
      >
        Retailer not found
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "black",
        color: "white",
        padding: "30px",
      }}
    >
      <h1>{retailer.name}</h1>

      <p>Phone: {retailer.phone}</p>

      <p>Address: {retailer.address}</p>

      <h2
        style={{
          marginTop: "40px",
        }}
      >
        Products
      </h2>

      {products.map((product) => (
        <div
          key={product.id}
          style={{
            border: "1px solid white",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "6px",
          }}
        >
          <p>{product.name}</p>

          <p>₹{product.price}</p>

          <p>Stock: {product.stock_qty}</p>

          <button
            onClick={() => decreaseQty(product.id)}
          >
            -
          </button>

          <span
            style={{
              margin: "0 12px",
            }}
          >
            {cart[product.id] || 0}
          </span>

          <button
            onClick={() => increaseQty(product.id)}
          >
            +
          </button>
        </div>
      ))}

      <h2
        style={{
          marginTop: "20px",
        }}
      >
        Total: ₹{totalAmount}
      </h2>

      <button
  onClick={placeOrder}
  style={{
    padding: "12px 20px",
    marginTop: "20px",
    cursor: "pointer",
  }}
>
  Place Order
     </button>
     
     {message && (
  <p
    style={{
      marginTop: "15px",
    }}
  >
    {message}
  </p>
)}
    </div>
  );
}

