import React from "react";
import ReactMapGL, { Marker, Popup } from "react-map-gl";

import styles from "./MapComponent.module.scss";

class MapComponent extends React.Component {
  state = {
    viewport: {
      latitude: this.props.userLocation.lat,
      longitude: this.props.userLocation.lng,
      width: "100%",
      height: "40vh",
      zoom: 10,
    },
  };

  baseState = this.state;

  componentDidUpdate(prevProps) {
    if (prevProps.activePlace !== this.props.activePlace) {
      if (
        Object.keys(this.props.activePlace).length === 0 &&
        this.props.activePlace.constructor === Object
      ) {
        this.setState(this.baseState);
      } else {
        this.setState((prevState) => ({
          viewport: {
            ...prevState.viewport,
            latitude: this.props.activePlace.geometry.location.lat,
            longitude: this.props.activePlace.geometry.location.lng,
            zoom: 13,
          },
        }));
      }
    }
  }

  render() {
    const { viewport } = this.state;
    const { places, activePlace } = this.props;
    return (
      <div>
        <ReactMapGL
          style={{ position: "relative" }}
          {...viewport}
          mapStyle="mapbox://styles/mapbox/light-v9"
          onViewportChange={(viewportChange) =>
            this.setState({ viewport: viewportChange })
          }
          mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_KEY}
        >
          {places.map((place) => (
            <Marker
              key={place.place.id}
              latitude={place.place.geometry.location.lat}
              longitude={place.place.geometry.location.lng}
              offsetLeft={-20}
              offsetTop={-10}
            >
              <div
                className={
                  activePlace && activePlace.id === place.place.id
                    ? styles.markerActive
                    : styles.marker
                }
              />
            </Marker>
          ))}
          {/* {activePlace ? (
            <Popup
              latitude={parseFloat(activePlace.geometry.location.lat)}
              longitude={parseFloat(activePlace.geometry.location.lng)}
            >
              {activePlace.name}
            </Popup>
          ) : null} */}
        </ReactMapGL>
      </div>
    );
  }
}

export default MapComponent;
