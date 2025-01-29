import React, { useEffect, useState } from "react";
import "./NewCollection.css";
import Item from "../Items/Item";

const NewCollection = () => {
  const [new_collection, setNew_collection] = useState([]);

  const url = "https://shoppy-ecommerce-website-backend.onrender.com";

  useEffect(() => {
    fetch(`${url}/newcollections`)
      .then((response) => response.json())
      .then((data) => setNew_collection(data));
  }, []);

  return (
    <div className="new-collection">
      <h1>New Collection </h1>
      <hr />
      <div className="collections">
        {new_collection.map((item, i) => {
          return (
            <Item
              key={i}
              id={item.id}
              name={item.name}
              image={item.image}
              new_price={item.new_price}
              old_price={item.old_price}
            />
          );
        })}
      </div>
    </div>
  );
};

export default NewCollection;
