import React from "react";
import "./Item.css";
import { Link } from "react-router-dom";

const Item = (props) => (
  <div className="item">
    <Link to={`/product/${props.id}`} onClick={window.scrollTo(0, 0)}>
      <img src={props.image} alt={props.name} />
    </Link>
    <p>{props.name}</p>
    <div className="item-price-details">
      <div className="item-new-price-details">${props.new_price}</div>
      <div className="item-old-price-details">${props.old_price}</div>
    </div>
  </div>
);

export default Item;
