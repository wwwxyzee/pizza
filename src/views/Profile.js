import React, { useEffect, useState } from "react";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { Container, Card, CardBody, CardTitle, ListGroup, ListGroupItem } from "reactstrap";
import Loading from "../components/Loading";
import Highlight from "../components/Highlight";

export const ProfileComponent = () => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    console.log("🔍 useEffect triggered - checking if user is authenticated:", isAuthenticated);
    console.log("User object:", user);

    const fetchUserMetadata = async () => {
      console.log("➡️ fetchUserMetadata() called");

      try {
        const audience = "pizza42demo";
        const token = await getAccessTokenSilently({
          audience: audience,
          scope: "openid profile email create:orders",
        });

        console.log("Using audience:", audience);
        console.log("Retrieved token:", token ? token.substring(0, 30) + "..." : "No token");

        const response = await fetch("http://localhost:3001/api/orders/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Response status:", response.status);

        const data = await response.json();
        console.log("Fetched order data:", data);

        if (data.orders) {
          setOrders(data.orders);
        }
      } catch (e) {
        console.error("Error fetching user metadata:", e.message);
      }
    };

    if (isAuthenticated && user?.sub) {
      fetchUserMetadata();
    }
  }, [isAuthenticated, user, getAccessTokenSilently]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    isAuthenticated && (
      <Container className="mb-5">
        <div className="mb-5">
          <h1 className="mb-3">Profile</h1>
          <Highlight>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </Highlight>
        </div>

        <Card className="shadow-sm">
          <CardBody>
            <CardTitle tag="h4">Order History</CardTitle>
            {orders.length > 0 ? (
              <ListGroup>
                {orders.map((order, index) => (
                  <ListGroupItem key={index}>
                    <strong>{order.item}</strong> ({order.size}) –{" "}
                    {new Date(order.time).toLocaleString()}
                  </ListGroupItem>
                ))}
              </ListGroup>
            ) : (
              <p>No orders found for this user.</p>
            )}
          </CardBody>
        </Card>
      </Container>
    )
  );
};

export default withAuthenticationRequired(ProfileComponent, {
  onRedirecting: () => <Loading />,
});
