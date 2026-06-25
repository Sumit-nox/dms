"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { supabase } from "@/lib/supabase/client";

export default function DistributorDashboard() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const [billedOrders, setBilledOrders] =
    useState<any[]>([]);

  const [dispatchedOrders, setDispatchedOrders] =
    useState<any[]>([]);

  const [deliveredOrders, setDeliveredOrders] =
    useState<any[]>([]);

  const [invoices, setInvoices] =
    useState<any[]>([]);

  const [selectedInvoice, setSelectedInvoice] =
    useState<number | null>(null);

  const [invoiceItems, setInvoiceItems] =
    useState<any[]>([]);

  const [selectedOrder, setSelectedOrder] =
    useState<number | null>(null);

  const [orderItems, setOrderItems] =
    useState<any[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [routeId, setRouteId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

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

    const { data: ordersData } = await supabase
      .from("orders")
      .select(
        `
        *,
        retailers(name)
      `
      )
      .eq("status", "Pending")
      .order("id", { ascending: false });

    console.log("ORDERS:", ordersData);

    const { data: billedOrdersData } = await supabase
      .from("orders")
      .select(`
    *,
    retailers(name)
  `)
      .eq("status", "Billed")
      .order("id", { ascending: false });

    const { data: dispatchedOrdersData } = await supabase
      .from("orders")
      .select(`
    *,
    retailers(name)
  `)
      .eq("status", "Dispatched")
      .order("id", { ascending: false });

    const { data: deliveredOrdersData } = await supabase
      .from("orders")
      .select(`
    *,
    retailers(name)
  `)
      .eq("status", "Delivered")
      .order("id", { ascending: false });

    const { data: invoicesData } = await supabase
      .from("invoices")
      .select("*")
      .order("id", { ascending: false });


    setRoutes(routesData || []);
    setProducts(productsData || []);
    setRetailers(retailersData || []);
    setOrders(ordersData || []);
    setBilledOrders(billedOrdersData || []);
    setDispatchedOrders(dispatchedOrdersData || []);
    setDeliveredOrders(deliveredOrdersData || []);
    setInvoices(invoicesData || []);
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

  async function loadOrderDetails(orderId: number) {
    const { data, error } = await supabase
      .from("order_items")
      .select(
        `
      *,
      products(name)
    `
      )
      .eq("order_id", orderId);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    console.log("ORDER ITEMS:", data);

    setOrderItems(data || []);
    setSelectedOrder(orderId);
  }

  async function approveOrder(orderId: number) {
    const { error } = await supabase
      .from("orders")
      .update({
        status: "Billed",
      })
      .eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Order Approved");

    await loadData();

    setSelectedOrder(null);
  }

  async function dispatchOrder(orderId: number) {
    // Load all order items

    const { data: items, error: itemsError } =
      await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

    if (itemsError) {
      alert(itemsError.message);
      return;
    }

    // Reduce stock for each product

    for (const item of items || []) {
      const { data: product, error: productError } =
        await supabase
          .from("products")
          .select("*")
          .eq("id", item.product_id)
          .single();

      if (productError) {
        alert(productError.message);
        return;
      }

      if (product.stock_qty < item.qty) {
        alert(
          `Not enough stock for ${product.name}`
        );
        return;
      }

      const newStock =
        product.stock_qty - item.qty;

      const { error: updateError } =
        await supabase
          .from("products")
          .update({
            stock_qty: newStock,
          })
          .eq("id", item.product_id);

      if (updateError) {
        alert(updateError.message);
        return;
      }

    }

    // Change order status

    const { error } = await supabase
      .from("orders")
      .update({
        status: "Dispatched",
      })
      .eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Order Dispatched");

    await loadData();
  }


  async function markDelivered(orderId: number) {

    const { error } = await supabase
      .from("orders")
      .update({
        status: "Delivered",
      })
      .eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Order Delivered");

    await loadData();
  }

  async function generateInvoice(orderId: number) {
    // Load order items

    const { data: items, error: itemsError } =
      await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

    if (itemsError) {
      alert(itemsError.message);
      return;
    }

    const total = (items || []).reduce(
      (sum, item) =>
        sum +
        item.qty * Number(item.unit_price),
      0
    );

    const { error } = await supabase
      .from("invoices")
      .insert([
        {
          order_id: orderId,
          total: total,
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Invoice Generated");

    await loadData();
  }

  async function loadInvoiceDetails(
    orderId: number
  ) {
    const { data, error } = await supabase
      .from("order_items")
      .select(`
      *,
      products(name)
    `)
      .eq("order_id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    setInvoiceItems(data || []);
    setSelectedInvoice(orderId);
  }

  async function downloadInvoicePDF(
    invoice: any
  ) {
    const { data: items, error } =
      await supabase
        .from("order_items")
        .select(`
        *,
        products(name)
      `)
        .eq(
          "order_id",
          invoice.order_id
        );

    if (error) {
      alert(error.message);
      return;
    }

    const doc = new jsPDF();

    let y = 20;

    doc.setFontSize(20);

    doc.text(
      "DMS Distribution System",
      20,
      y
    );

    y += 20;

    doc.setFontSize(14);

    doc.text(
      `Invoice #${invoice.id}`,
      20,
      y
    );

    y += 10;

    doc.text(
      `Order ID: ${invoice.order_id}`,
      20,
      y
    );

    y += 10;

    doc.text(
      `Date: ${new Date(
        invoice.billed_at
      ).toLocaleDateString()}`,
      20,
      y
    );

    y += 15;

    doc.line(20, y, 190, y);

    y += 15;

    doc.text(
      "Products",
      20,
      y
    );

    y += 10;

    items?.forEach((item) => {
      doc.text(
        `${item.products?.name}`,
        20,
        y
      );

      y += 8;

      doc.text(
        `Qty: ${item.qty}`,
        30,
        y
      );

      y += 8;

      doc.text(
        `Price: Rs. ${item.unit_price}`,
        30,
        y
      );

      y += 12;
    });

    doc.line(20, y, 190, y);

    y += 15;

    doc.setFontSize(16);

    doc.text(
      `Grand Total: Rs. ${invoice.total}`,
      20,
      y
    );

    doc.save(
      `invoice-${invoice.id}.pdf`
    );
  }

  const totalProducts = products.length;

  const healthyProducts = products.filter(
    (p) => Number(p.stock_qty) > 10
  ).length;

  const inventoryHealth =
    totalProducts === 0
      ? 0
      : Math.round(
        (healthyProducts /
          totalProducts) *
        100
      );

  const lowStockProducts = products.filter(
    (p) =>
      Number(p.stock_qty) > 0 &&
      Number(p.stock_qty) <= 10
  ).length;

  const outOfStockProducts = products.filter(
    (p) => Number(p.stock_qty) === 0
  ).length;

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    if (stockFilter === "low")
      return (
        matchesSearch &&
        Number(product.stock_qty) > 0 &&
        Number(product.stock_qty) <= 10
      );

    if (stockFilter === "out")
      return (
        matchesSearch &&
        Number(product.stock_qty) === 0
      );

    return matchesSearch;
  });

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

          <div className="grid grid-cols-3 gap-4 mb-6">

            <div className="border p-4 rounded">
              <div className="text-sm text-gray-400">
                Total Products
              </div>

              <div className="text-3xl font-bold">
                {totalProducts}
              </div>
            </div>

            <div className="border p-4 rounded">
              <div className="text-sm text-gray-400">
                Low Stock
              </div>

              <div className="text-3xl font-bold text-yellow-500">
                {lowStockProducts}
              </div>
            </div>

            <div className="border p-4 rounded">
              <div className="text-sm text-gray-400">
                Out Of Stock
              </div>

              <div className="border p-4 rounded">
                <div className="text-sm text-gray-400">
                  Inventory Health
                </div>

                <div className="text-3xl font-bold text-green-500">
                  {inventoryHealth}%
                </div>
              </div>

              <div className="text-3xl font-bold text-red-500">
                {outOfStockProducts}
              </div>
            </div>

          </div>

          <h2 className="text-2xl font-bold mb-4">
            Products
          </h2>

          <input
            type="text"
            placeholder="Search Product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 mb-4 bg-white text-black rounded"
          />

          <div className="flex gap-2 mb-4">

            <button
              onClick={() => setStockFilter("all")}
              className="bg-gray-700 px-3 py-1 rounded"
            >
              All
            </button>

            <button
              onClick={() => setStockFilter("low")}
              className="bg-yellow-600 px-3 py-1 rounded"
            >
              Low Stock
            </button>

            <button
              onClick={() => setStockFilter("out")}
              className="bg-red-600 px-3 py-1 rounded"
            >
              Out Of Stock
            </button>

          </div>

          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="border p-4 rounded mb-3"
            >
              <div>{product.name}</div>
              <div>₹{product.price}</div>
              <div>Stock: {product.stock_qty}</div>

              {Number(product.stock_qty) === 0 && (
                <div className="mt-2 text-red-500 font-bold">
                  🔴 OUT OF STOCK
                </div>
              )}

              {product.stock_qty <= 10 && (
                <div className="mt-2 text-red-500 font-bold">
                  ⚠ Low Stock
                </div>
              )}
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
      <div className="mb-12">
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

      {/* Pending Orders */}

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">
          Billed Orders
        </h2>

        {billedOrders.length === 0 ? (
          <p>No billed orders.</p>
        ) : (
          billedOrders.map((order) => (
            <div
              key={order.id}
              className="border p-4 rounded mb-3"
            >
              <div>

                <strong>
                  Order #{order.id}
                </strong>
              </div>

              <div>
                Retailer: {order.retailers?.name}
              </div>

              <div>
                Status: {order.status}
              </div>

              <div>
                Date: {order.order_date}
              </div>

              <button
                onClick={() => dispatchOrder(order.id)}
                className="mt-4 bg-yellow-600 px-4 py-2 rounded"
              >
                Dispatch Order
              </button>

            </div>

          ))
        )}

        {/* Dispatched Orders */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">
            Dispatched Orders
          </h2>

          {dispatchedOrders.length === 0 ? (
            <p>No dispatched orders.</p>
          ) : (
            dispatchedOrders.map((order) => (
              <div
                key={order.id}
                className="border p-4 rounded mb-3"
              >
                <div>
                  <strong>
                    Order #{order.id}
                  </strong>
                </div>

                <div>
                  Retailer: {order.retailers?.name}
                </div>

                <div>
                  Status: {order.status}
                </div>

                <div>
                  Date: {order.order_date}
                </div>

                <button
                  onClick={() => markDelivered(order.id)}
                  className="mt-4 bg-purple-600 px-4 py-2 rounded"
                >
                  Mark Delivered
                </button>

              </div>
            ))
          )}
        </div>

      </div>

      {/* Delivered Orders */}

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">
          Invoices
        </h2>

        {invoices.length === 0 ? (
          <p>No invoices generated.</p>
        ) : (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="border p-4 rounded mb-3"
            >
              <div>
                <strong>
                  Invoice #{invoice.id}
                </strong>
              </div>

              <div>
                Order #{invoice.order_id}
              </div>

              <div>
                Total: ₹{invoice.total}
              </div>

              <button
                onClick={() =>
                  loadInvoiceDetails(
                    invoice.order_id
                  )
                }
                className="mt-3 bg-blue-600 px-4 py-2 rounded"
              >
                View Invoice
              </button>

              <button
                onClick={() =>
                  downloadInvoicePDF(invoice)
                }
                className="mt-3 ml-3 bg-green-600 px-4 py-2 rounded"
              >
                Download PDF
              </button>

              {selectedInvoice ===
                invoice.order_id && (
                  <div className="mt-4 border-t pt-4">

                    <h3 className="font-bold mb-3">
                      Invoice Items
                    </h3>

                    {invoiceItems.map((item) => (
                      <div
                        key={item.id}
                        className="border p-3 rounded mb-2"
                      >
                        <div>
                          Product:
                          {item.products?.name}
                        </div>

                        <div>
                          Qty: {item.qty}
                        </div>

                        <div>
                          Price: ₹{item.unit_price}
                        </div>
                      </div>
                    ))}

                    <div className="font-bold mt-3">
                      Total: ₹
                      {invoiceItems.reduce(
                        (sum, item) =>
                          sum +
                          item.qty *
                          Number(item.unit_price),
                        0
                      )}
                    </div>

                  </div>
                )}

              <div>
                Date:{" "}
                {new Date(
                  invoice.billed_at
                ).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">
          Delivered Orders
        </h2>

        {deliveredOrders.length === 0 ? (
          <p>No delivered orders.</p>
        ) : (
          deliveredOrders.map((order) => (
            <div
              key={order.id}
              className="border p-4 rounded mb-3"
            >
              <div>
                <strong>
                  Order #{order.id}
                </strong>
              </div>

              <div>
                Retailer: {order.retailers?.name}
              </div>

              <div>
                Status: {order.status}
              </div>

              <div>
                Date: {order.order_date}
              </div>

              <button
                onClick={() => generateInvoice(order.id)}
                className="mt-4 bg-cyan-600 px-4 py-2 rounded"
              >
                Generate Invoice
              </button>

            </div>
          ))
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">
          Pending Orders
        </h2>

        {orders.length === 0 ? (
          <p>No pending orders.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="border p-4 rounded mb-3"
            >
              <div>
                <strong>
                  Order #{order.id}
                </strong>
              </div>

              <div>
                Retailer:{" "}
                {order.retailers?.name}
              </div>

              <div>
                Status: {order.status}
              </div>

              <div>
                Date: {order.order_date}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => loadOrderDetails(order.id)}
                  className="bg-blue-600 px-4 py-2 rounded"
                >
                  View Details
                </button>

                {selectedOrder === order.id && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="font-bold mb-3">
                      Order Items
                    </h3>

                    {orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="border p-3 rounded mb-2"
                      >
                        <div>
                          Product: {item.products?.name}
                        </div>

                        <div>
                          Qty: {item.qty}
                        </div>

                        <div>
                          Price: ₹{item.unit_price}
                        </div>
                      </div>
                    ))}

                    <div className="mt-4 font-bold">
                      Total: ₹
                      {orderItems.reduce(
                        (sum, item) =>
                          sum +
                          item.qty *
                          Number(item.unit_price),
                        0
                      )}
                    </div>

                    <button
                      onClick={() => approveOrder(order.id)}
                      className="mt-4 bg-green-600 px-4 py-2 rounded"
                    >
                      Approve Order
                    </button>

                  </div>
                )}

              </div>

            </div>
          ))
        )}
      </div>
    </main>
  );
}