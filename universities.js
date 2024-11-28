const endpoint = "https://query.wikidata.org/sparql";
const urlParams = new URLSearchParams(window.location.search);
const country = urlParams.get('country');
document.getElementById('country-name').textContent = `Universities in ${country}`;



const loader = document.getElementById('loader');
loader.style.display = "flex";

// Маппинг стран на их Wikidata ID
const countryIds = {
    "United States": "wd:Q30",         // США
    "Ukraine": "wd:Q212",              // Украина
    "Netherlands": "wd:Q55",           // Нидерланды
};

// Проверяем, есть ли маппинг для указанной страны
const countryId = countryIds[country];
let query;

if (countryId) {
    query = `
      SELECT ?university ?universityLabel ?location ?locationLabel ?image WHERE {
        ?university wdt:P31 wd:Q3918;          # Университет
                   wdt:P17 ${countryId}.      # Страна
        OPTIONAL { ?university wdt:P276 ?physicalLocation. }
        OPTIONAL { ?university wdt:P159 ?hqLocation. }
        OPTIONAL { ?university wdt:P131 ?adminTerritorialEntity. }
        OPTIONAL { ?university wdt:P18 ?image. }
        BIND(COALESCE(?physicalLocation, ?hqLocation, ?adminTerritorialEntity) AS ?location)
        FILTER(BOUND(?image))
        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
      }
      LIMIT 50
    `;
} else {
    // Если страна не найдена, используем текстовое соответствие
    query = `
      SELECT ?university ?universityLabel ?location ?locationLabel ?image WHERE {
        ?university wdt:P31 wd:Q3918;          # Университет
                   wdt:P17 ?country.          # Страна (общий поиск)
        ?country rdfs:label "${country}"@en.  # Текстовое имя страны
        OPTIONAL { ?university wdt:P276 ?physicalLocation. }
        OPTIONAL { ?university wdt:P159 ?hqLocation. }
        OPTIONAL { ?university wdt:P131 ?adminTerritorialEntity. }
        OPTIONAL { ?university wdt:P18 ?image. }
        BIND(COALESCE(?physicalLocation, ?hqLocation, ?adminTerritorialEntity) AS ?location)
        FILTER(BOUND(?image))
        SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
      }
      LIMIT 50
    `;
}

// Выполняем запрос к Wikidata
fetch(endpoint + "?query=" + encodeURIComponent(query), {
    headers: { Accept: "application/sparql-results+json" }
})
    .then(response => response.json())
    .then(data => {
        const universities = data.results.bindings;
        const list = document.getElementById('university-list');
        list.innerHTML = ""; // Очистить список

        if (universities.length === 0) {
            list.innerHTML = `<p>No universities found for "${country}". Please check the input.</p>`;
            return;
        }

        // Отслеживаем уникальные университеты
        const seenUniversities = {};
        const uniqueUniversities = [];

        universities.forEach(item => {
            const name = item.universityLabel.value;

            // Пропускаем университеты с одинаковыми названиями
            if (seenUniversities[name]) return;
            seenUniversities[name] = true;

            const location = item.locationLabel ? item.locationLabel.value : "Unknown location";
            const id = item.university.value.split("/").pop();
            const imageUrl = item.image ? item.image.value : "";

            uniqueUniversities.push({
                name,
                location,
                id,
                imageUrl
            });
        });

        // Отображаем только 12 университетов
        uniqueUniversities.slice(0, 12).forEach(university => {
            const card = document.createElement('div');
            card.className = 'university-card';

            card.innerHTML = `
                <div class="university-card-content">
                    <img src="${university.imageUrl}" alt="${university.name}" class="university-image"/>
                    <h3>${university.name}</h3>
                    <p><strong>Location:</strong> ${university.location}</p>
                </div>
            `;

            card.addEventListener('click', () => {
                window.location.href = `university.html?id=${university.id}`;
            });

            list.appendChild(card);
        });
    })
    .catch(error => {
        console.error("Error fetching universities:", error);
        document.getElementById('university-list').innerHTML = `<p>Error loading data</p>`;
    })
    .finally(() => {
        // Скрываем лоадер после загрузки
        loader.style.display = "none";
    });
