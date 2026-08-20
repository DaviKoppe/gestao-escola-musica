import "./Card.css";

function Card(props){
    return (
        <div className="card">

            <div className="icone">
                {props.icone}
            </div>

            <h2>{props.titulo}</h2>
            <p>{props.valor}</p>
        </div>
    )
}

export default Card