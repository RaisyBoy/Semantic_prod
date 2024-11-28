// Получаем ID университета из URL
const urlParams = new URLSearchParams(window.location.search);
const universityId = urlParams.get('id');

// SPARQL запрос для получения полной информации об университете
const endpoint = "https://query.wikidata.org/sparql";
const query = `
  SELECT ?university ?universityLabel ?countryLabel ?locationLabel ?image ?website ?founded ?students ?employees WHERE {
    BIND(wd:${universityId} AS ?university).
    ?university wdt:P17 ?country.       # Страна
    OPTIONAL { ?university wdt:P276 ?location. }    # Локация
    OPTIONAL { ?university wdt:P159 ?hqLocation. }   # Штаб-квартира
    OPTIONAL { ?university wdt:P131 ?adminTerritorialEntity. } # Административная единица
    OPTIONAL { ?university wdt:P18 ?image. }          # Изображение университета
    OPTIONAL { ?university wdt:P856 ?website. }       # Вебсайт
    OPTIONAL { ?university wdt:P571 ?founded. }       # Год основания
    OPTIONAL { ?university wdt:P2196 ?students. }     # Количество студентов
    OPTIONAL { ?university wdt:P1128 ?employees. }        # Количество преподавателей
    BIND(COALESCE(?location, ?hqLocation, ?adminTerritorialEntity) AS ?location) # Выбор доступной локации
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
  }
`;


fetch(endpoint + "?query=" + encodeURIComponent(query), {
    headers: { Accept: "application/sparql-results+json" }
})
    .then(response => response.json())
    .then(data => {
        const result = data.results.bindings[0];
        const container = document.getElementById("university-info");

        if (!result) {
            container.innerHTML = `<p>No details available for this university.</p>`;
            return;
        }

        // Форматируем данные
        const name = result.universityLabel.value;
        const country = result.countryLabel ? result.countryLabel.value : "Unknown";
        const location = result.locationLabel ? result.locationLabel.value : "Unknown location";
        const imageUrl = result.image ? result.image.value : ""; // Изображение университета
        const website = result.website ? `<a href="${result.website.value}" target="_blank">Visit website</a>` : "No website available";
        const founded = result.founded ? new Date(result.founded.value).getFullYear() : "Unknown founding year";
        const students = result.students ? result.students.value : "Unknown";
        const employees = result.employees ? result.employees.value : "Unknown";

        // Отображаем данные
        document.getElementById("university-name").textContent = name;
        container.innerHTML = `
    <div class="university-info-content">
        ${imageUrl ? `<img src="${imageUrl}" alt="${name}" class="university-image-info"/>` : ''}
        <div class="university-info-table">
            <div class="info-row">
                <div class="info-cell"><strong>Country:</strong> ${country}</div>
                <div class="info-cell"><strong>Location:</strong> ${location}</div>
                <div class="info-cell"><strong>Website:</strong> ${website}</div>
            </div>
            <div class="info-row">
                <div class="info-cell"><strong>Year Founded:</strong> ${founded}</div>
                <div class="info-cell"><strong>Number of Students:</strong> ${students}</div>
                <div class="info-cell"><strong>Number of Employees:</strong> ${employees}</div>
            </div>
        </div>
    </div>
`;
    })
    .catch(error => {
        console.error("Error fetching university details:", error);
        document.getElementById("university-info").innerHTML = `<p>Error loading data.</p>`;
    });
