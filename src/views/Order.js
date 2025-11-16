import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button, Alert, FormGroup, Label, Input } from "reactstrap";
import { placeOrder } from "../api/orders";

const Order = () => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [pizzaType, setPizzaType] = useState("Pepperoni");
  const [pizzaSize, setPizzaSize] = useState("Medium");
  const [status, setStatus] = useState(null);

  const handleOrder = async () => {
    if (!isAuthenticated) {
      setStatus({ type: "error", message: "Please log in first." });
      return;
    }

    if (!user?.email_verified) {
      setStatus({
        type: "error",
        message: "Please verify your email before placing an order.",
      });
      return;
    }

    try {
      const orderData = {
        item: pizzaType,
        size: pizzaSize,
        time: new Date().toISOString(),
      };

      const result = await placeOrder(getAccessTokenSilently, orderData);
      setStatus({
        type: "success",
        message: `Order placed! ${result.message}`,
      });
    } catch (err) {
      setStatus({ type: "error", message: `Order failed: ${err.message}` });
    }
  };

  return (
    <div className="order-container">
      <h1>Place an Order</h1>

      {status && (
        <Alert color={status.type === "error" ? "danger" : "success"}>
          {status.message}
        </Alert>
      )}

      <FormGroup>
        <Label for="pizzaType">Select Pizza</Label>
        <Input
          id="pizzaType"
          type="select"
          value={pizzaType}
          onChange={(e) => setPizzaType(e.target.value)}
        >
          <option>Pepperoni</option>
          <option>Margherita</option>
          <option>Veggie</option>
          <option>BBQ Chicken</option>
          <option>Hawaiian</option>
        </Input>
      </FormGroup>

      <FormGroup>
        <Label for="pizzaSize">Select Size</Label>
        <Input
          id="pizzaSize"
          type="select"
          value={pizzaSize}
          onChange={(e) => setPizzaSize(e.target.value)}
        >
          <option>Small</option>
          <option>Medium</option>
          <option>Large</option>
        </Input>
      </FormGroup>

      <Button color="primary" onClick={handleOrder}>
        Place Order
      </Button>
    </div>
  );
};

export default Order;
