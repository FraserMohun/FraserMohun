mapboxgl.accessToken = 'pk.eyJ1IjoiMjgzMDM2NG0iLCJhIjoiY2xjcGM5dzU4MDZ3ZTQxbjJ3M2ExNnQzNSJ9.lZsoSrJJ4Oz1UnLkG95TyA';

    const map = new mapboxgl.Map({
        container: 'map', 
        style: 'mapbox://styles/2830364m/cld2810ky002k01r16ee4c86z',
        center: [-3.51, 56.81], // starting centre of map in Scotland, not including Shetland islands, where no official whisky distilleries)
        zoom: 5.50// starting zoom
    });
    
// Create a return to Map extent button //

    document.getElementById('Map-extent-button').addEventListener('click', () => {
        map.fitBounds([
            [-7.87, 53.5], // southwestern corner of the bounds
            [-0.90, 59.52] // northeastern corner of the bounds
        ]);
    });

// Add hillshading to land //

map.on('load', () => {
map.addSource('dem', {
'type': 'raster-dem',
'url': 'mapbox://mapbox.mapbox-terrain-dem-v1'
});
map.addLayer(
{
'id': 'hillshading',
'source': 'dem',
'type': 'hillshade'
},
'land-structure-polygon'
);
});

// Create a map popup for distillery dataset for when hovered over, the distillery name is shown //
var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

map.on('mouseenter', 'Whisky', function(e) {
  map.getCanvas().style.cursor = 'pointer';

  var coordinates = e.features[0].geometry.coordinates.slice();
  var description = e.features[0].properties.DISTILLERY;

  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  popup
    .setLngLat(coordinates)
    .setHTML(description)
    .addTo(map);
});

map.on('mouseleave', 'Whisky', function() {
  map.getCanvas().style.cursor = '';
  popup.remove();
});

map.on("click", (event) => {
  const features = map.queryRenderedFeatures(event.point, {
    layers: ["Whisky"]
  });
  if (!features.length) {
    return;
  }
  const feature = features[0];

  //Popup information
  const popup = new mapboxgl.Popup({className: "click-popup" })
    .setLngLat(feature.geometry.coordinates)
    .setHTML(
      `<h3>${feature.properties.DISTILLERY}</h3><p><h4>Region: ${feature.properties.Region}</h4><h5>Production Type: ${feature.properties.Type}</h5><h6>Public Access: </span>${feature.properties.Public_Access}</h6>`
      )
    .addTo(map);
});

// Center and zoom on the map on the coordinates of any clicked malt whisky distillery from the 'distilleries' layer.
map.on('click', 'Whisky', (e) => {
map.flyTo({center: e.features[0].geometry.coordinates, zoom: 12.5
});
});
 
// Change the cursor to a pointer when the it enters a feature in the layer.
map.on('mouseenter', 'Whisky', () => {
map.getCanvas().style.cursor = 'pointer';
});
 
// Change it back to a default when it leaves.
map.on('mouseleave', 'Whisky', () => {
map.getCanvas().style.cursor = 'default';
});

// Add dataset urls from Mapbox 

const data_urlWhisky = "https://api.mapbox.com/datasets/v1/2830364m/cldrxighl0fmv20mpevktvy66?access_token=pk.eyJ1IjoiMjgzMDM2NG0iLCJhIjoiY2xjcGM5dzU4MDZ3ZTQxbjJ3M2ExNnQzNSJ9.lZsoSrJJ4Oz1UnLkG95TyA";


// Filtering "Display All", "Production Type" and "Public Access" for Toggling Buttons //

    //Filter for Public Access //

filterAccess = ['!=', ['get', 'Public_Access'], 'placeholder'];

document.getElementById('filters').addEventListener('change', (event) => {
    
    const Access = event.target.value;
    console.log(Access);
    if (Access == "all") {
      filterAccess = ['!=', ['get', 'Public_Access'], 'placeholder'];
    } else if (Access == "Open") { 
      filterAccess = ['==', ['get', 'Public_Access'], 'Open'];
    } else if (Access == 'Closed') {
      filterAccess = ['==', ['get', 'Public_Access'], 'Closed'];
    } 
 

    // Production Type Filter //

    filterProduct = ['!=', ['get', 'Type'], 'placeholder'];

    const type = event.target.value;
    console.log(type);
    if (type == "all") {
      filterProduct = ['!=', ['get', 'Type'], 'placeholder'];
    } else if (type == 'Malt') {
      filterProduct = ['==', ['get', 'Type'], 'Malt'];
    } else if (type == "Grain") { 
      filterProduct = ['==', ['get', 'Type'], 'Grain'];
    } else {
      console.log("error");
    }
    map.setFilter("Whisky", ["all", filterProduct,filterAccess]);
});

// Sidelist for linking Distillery names to map icons, with link to Distillery Website upon sidelist click//

    var Whisky = [];


    // Create a popup, but don't add it to the map yet.
    var popup = new mapboxgl.Popup({
        closeButton: false
    });

    var filterEl = document.getElementById('feature-filter');
    var listingEl = document.getElementById('feature-listing');

    function renderListings(features) {
        var empty = document.createElement('p');
        // Clear any existing listings
        listingEl.innerHTML = '';
        if (features.length) {
            features.forEach(function (feature) {
                var prop = feature.properties;
                var item = document.createElement('a');
                item.href = prop.Website;
                item.target = '_blank';
                item.textContent = prop.DISTILLERY;
                item.addEventListener('mouseover', function () {
                    // Highlight corresponding feature on the map
                    popup
                        .setLngLat(feature.geometry.coordinates)
                        .setText(
                            feature.properties.DISTILLERY
                        )
                        .addTo(map);
                });
                listingEl.appendChild(item);
            });

            // Show the filter input
            filterEl.parentNode.style.display = 'block';
        } else if (features.length === 0 && filterEl.value !== '') {
            empty.textContent = 'No results found';
            listingEl.appendChild(empty);
        } else {
            empty.textContent = 'Drag cursor over the map to show Distillery list!';
            listingEl.appendChild(empty);

            filterEl.parentNode.style.display = 'none';

            map.setFilter('Whisky', ['has', 'abbrev']);
        }
    }

    function normalize(string) {
        return string.trim().toLowerCase();
    }

    function getUniqueFeatures(array, comparatorProperty) {
        var existingFeatureKeys = {};
        var uniqueFeatures = array.filter(function (el) {
            if (existingFeatureKeys[el.properties[comparatorProperty]]) {
                return false;
            } else {
                existingFeatureKeys[el.properties[comparatorProperty]] = true;
                return true;
            }
        });

        return uniqueFeatures;
    }

    map.on('load', () => {
        map.addLayer({
            id: 'Whisky',
            source: {
            type: 'geojson',
            data: data_urlWhisky
            },
            layout: {
                'icon-image': 'whisky-svgrepo-com (4)',
                'icon-padding': 0,
                'icon-allow-overlap': true
            }
        });


        map.on('moveend', function () {
            var features = map.queryRenderedFeatures({ layers: ['Whisky'] });

            if (features) {
                var uniqueFeatures = getUniqueFeatures(features, 'Website');
                // Populate features for the listing overlay.
                renderListings(uniqueFeatures);

                filterEl.value = '';

                Whisky = uniqueFeatures;
            }
        });

        map.on('mousemove', 'Whisky', function (e) {
            map.getCanvas().style.cursor = 'pointer';

            var feature = e.features[0];
            popup
                .setLngLat(feature.geometry.coordinates)
                .setText(
                    feature.properties.DISTILLERY        
                )
                .addTo(map);
        });

        map.on('mouseleave', 'Whisky', function () {
            map.getCanvas().style.cursor = '';
            popup.remove();
        });

        filterEl.addEventListener('keyup', function (e) {
            var value = normalize(e.target.value);

            // Filter visible features that don't match the input value.
            var filtered = Whisky.filter(function (feature) {
                var name = normalize(feature.properties.DISTILLERY);
                var name = normalize(feature.properties.Website);
                return name.indexOf(value) > -1 || name.indexOf(value) > -1;
            });

            renderListings(filtered);

            // Set the filter to populate features into the layer.
            if (filtered.length) {
                map.setFilter('Whisky', [
                    'match',
                    ['get', 'abbrev'],
                    filtered.map(function (feature) {
                        return feature.properties.DISTILLERY;
                    }),
                    true,
                    false
                ]);
            }
        });

        // Call this function on initialization
        // passing an empty array to render an empty state
        renderListings([]);
    });



// Creating Legend for Regions //

map.on("load", () => {
  const layers = ["Campbelltown", "Highlands", "Islay", "Lowlands", "Speyside"];
  const colors = ["#5b340b", "#a46623", "#fbf018", "#f7951d", "#d4c9ba"];
  const legend_bg = document.getElementById("lg-bg");
  const legend_wd = document.getElementById("lg-wd");
  layers.forEach((layer, i) => {
    const color = colors[i];
    const key_bg = document.createElement("div");
    //place holder
    key_bg.className = "legend-key-wd";
    if (layer == "Whisky") {
      key_bg.id = "legend-key-bg-car";
    }
    key_bg.style.backgroundColor = color;
    // key_bg.innerHTML = `${layer}`;
    legend_bg.appendChild(key_bg);

    const key_word = document.createElement("div");
    key_word.className = "legend-key-wd";
    if (layer == "Whisky") {
      key_word.id = "legend-key-wd-car";
    }
    // key_word.style.backgroundColor = color;
    key_word.innerHTML = `${layer}`;
    legend_wd.appendChild(key_word);
  });
});


// Map Controls //

  const geocoder = new MapboxGeocoder({
    // Initialize the geocoder
    accessToken: mapboxgl.accessToken, // Set the access token
    mapboxgl: mapboxgl, // Set the mapbox-gl instance
    marker: false, // Do not use the default marker style
    placeholder: "Search for places in Scotland", // Placeholder text for the search bar
    proximity: {
      longitude: 57.18,
      latitude: -3.91,
    } // Scotland Centre
  });

  map.addControl(geocoder, "top-right");
  map.addControl(new mapboxgl.NavigationControl(), "top-right");

  map.addControl(
    new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }),
    "top-right"
  );

// Add fullscreen control element
map.addControl(new mapboxgl.FullscreenControl());