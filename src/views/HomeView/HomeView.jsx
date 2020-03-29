import React from "react";
import axios from "axios";
import Airtable from "airtable";
import styles from "./HomeView.module.scss";
import LocationInput from "../../components/LocationInput/LocationInput";
import BusinessesList from "../../components/BusinessesList/BusinessesList";
import Filters from "../../components/Filters/Filters";
import Button from "../../components/Button/Button";
import { FILTER_LIST, NOT_READY_TO_SEARCH } from "../../constants";
import MapComponent from "../../components/MapComponent/MapComponent";

const base = new Airtable({ apiKey: process.env.REACT_APP_AIRTABLE_KEY }).base(
  "app7LKgKsFtsq1x8D"
);

class HomeView extends React.Component {
  state = {
    searchQuery: {
      location: {
        name: "",
        lat: null,
        lng: null,
      },
    },
    resultPlaces: [],
    filteredPlaces: [],
    loading: false,
    activePlace: null,
  };

  placeType = {
    label: "",
    value: "",
  };

  freeTextSearch = "";

  checkForReadyToSearch = (event = null) => {
    if (event) event.preventDefault();
    const sq = this.state.searchQuery;
    if (
      (sq.location.name || sq.location.lat) &&
      (this.placeType.value || this.freeTextSearch)
    ) {
      // we have some new data, so let's click search for them
      this.startSearch(null);
    } else {
      // do nothing --
      // alert(NOT_READY_TO_SEARCH);
    }
  };

  findPlaces = () => {
    this.setState({
      resultPlaces: [],
      loading: true,
    });
    let uri = `https://cors-anywhere.herokuapp.com/${process.env.REACT_APP_GOOGLE_API__PLACES_ENDPOINT}/nearbysearch/json?key=${process.env.REACT_APP_GOOGLE_API_KEY}&location=${this.state.searchQuery.location.lat},${this.state.searchQuery.location.lng}&radius=8000`;
    if (this.placeType.value) {
      uri += "&types=" + this.placeType.value;
    } else {
      if (this.freeTextSearch) uri += "&keyword=" + this.freeTextSearch;
    }
    console.log(uri);
    axios.get(uri).then((data) => {
      data.data.results.forEach((place) => {
        this.checkIsPlaceInDB(place).then((gofundmeURL) => {
          this.setState((prevState) => ({
            loading: false,
            resultPlaces: [
              {
                place,
                gofundmeURL: gofundmeURL || null,
              },
              ...prevState.resultPlaces,
            ],
            filteredPlaces: this.state.resultPlaces,
          }));
        });
      });
    });
  };

  checkIsPlaceInDB = (place) => {
    return new Promise((resolve, reject) => {
      base("Table 1").find("recVm6SBLJTcZ5hpN", (err, record) => {
        if (err) reject(err);
        record.fields.google_places_id === place.id
          ? resolve(record.fields.gofundme_url)
          : resolve(null);
      });
    });
  };

  getLocation = (latlng, address) => {
    this.setState({
      searchQuery: {
        location: {
          name: address,
          lat: latlng.lat,
          lng: latlng.lng,
        },
      },
      resultPlaces: [],
      filteredPlaces: [],
      loading: false,
    });
    this.checkForReadyToSearch();
  };

  submitSearch = (event) => {
    if (event) event.preventDefault();
    this.findPlaces();
    console.log(event || "auto-submitting");
  };

  // callback function called on filterClicks (sends a CSV of selected values)
  getFilteredValues = (placeType, isCategorySelect) => {
    if (isCategorySelect) {
      this.placeType = { value: placeType.value, label: placeType.label };
    } else {
      this.freeTextSearch = placeType.text;
      this.placeType = {};
    }
    this.checkForReadyToSearch();
  };

  render() {
    return (
      <main className={styles.siteWrapper}>
        <header className={styles.siteHeader}>
          <form
            onSubmit={event => this.checkForReadyToSearch(event)}
            className={styles.inputsWrapper}
          >
            <div style={{ flex: "2" }}>
              <LocationInput
                getLocationInfo={(latlng, address) =>
                  this.getLocation(latlng, address)
                }
              />
            </div>
            <div style={{ flex: "2" }}>
              <Filters
                filterList={FILTER_LIST}
                filteredValuesHandler={this.getFilteredValues}
              />
            </div>
            <Button style={{ flex: "1" }} type="submit">
              Search
            </Button>
          </form>
        </header>
        <div className={styles.contentWrapper}>
          <section>
            <h2 className={styles.resultsTitle}>
              {this.state.resultPlaces.length > 0
                ? `Search results for '${
                    this.placeType.label || this.freeTextSearch
                  }' near '${this.state.searchQuery.location.name}'`
                : ""}
            </h2>
            {this.state.resultPlaces && (
              <BusinessesList
                listOfPlaces={this.state.resultPlaces}
                getActivePlace={(place) =>
                  this.setState({ activePlace: { ...place } })
                }
              />
            )}
            {this.state.loading && <span>loading...</span>}
          </section>
          <div>
            {this.state.searchQuery.location.lat && (
              <MapComponent
                userLocation={this.state.searchQuery.location}
                places={this.state.resultPlaces}
                activePlace={this.state.activePlace}
              />
            )}
          </div>
        </div>
      </main>
    );
  }
}
export default HomeView;
