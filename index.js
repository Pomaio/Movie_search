import { mapMovie } from './scripts/mapMovie.js';
import { debounce } from './node_modules/debounce/index.js';

// Components
import './scripts/currentYear.js';
import './scripts/movieCard.js';

const resultsContainer = document.querySelector('.result_grid');
const form = document.querySelector('.search_begin');
const input = document.querySelector('.search_input');
const result = document.querySelector('.title_result_begin');
const history = document.querySelector('.history');
const closeHistory = document.querySelector('.history_water');
const Loader = document.querySelector('.loader_hidden');

const render = (movieData) => {
    // Используем компонент
    const movie = document.createElement('movie-card');
    // Добавим данные
    movie.poster = movieData.poster;
    movie.title = movieData.title;
    movie.year = movieData.year;
    movie.link = movieData.link;
    movie.genre = movieData.genre;
    return movie;
};
let controller = new AbortController();
let signal = controller.signal;
let LastsearchStatus = 0;

const search = async (searchTerm) => {
    while (resultsContainer.firstChild) {
        resultsContainer.removeChild(resultsContainer.firstChild);
    }

    //отклоняем запрос если пришел новый
    if(LastsearchStatus===1) {
        controller.abort();
        controller = new AbortController();
        signal = controller.signal;
    }
    LastsearchStatus=0;
    //включаем лоадер
    Loader.className = 'lds-ellipsis';
    const { Search } = await fetch(
        `http://www.omdbapi.com/?apikey=5c068a71&type=movie&s=${searchTerm}`,{signal}
    ).then((r) => r.json()).finally(() => LastsearchStatus=1);
    console.log(Search);
    if(!Search) {
        result.innerHTML = 'Мы не поняли о чем речь ¯\\_(ツ)_/¯'
    }
    else {
        result.innerHTML = 'Найдено ' + Search.length + ' фильмов';
        const movies = Search.map((result) => render(mapMovie(result)));
        const fragment = document.createDocumentFragment();
        movies.forEach((movie) => fragment.appendChild(movie));
        resultsContainer.appendChild(fragment);
    }
    //выключаем лоадер
    Loader.className = 'loader_hidden';
};
//Ну тут вроде localstorage
//это сохранение
const SaveHistory = (name) => {
    let stringHistory = localStorage.getItem('history');
    stringHistory = (stringHistory == null) ? name + '|value|' : stringHistory += name + '|value|';
   localStorage.setItem('history', stringHistory);
};
//это извлечение истории из localstorage
const ExtractionHistory = () => {
    if(localStorage.getItem('history') !== null) {
        const arrayHistory = localStorage
            .getItem('history')
            .split('|value|')
            .filter((name) =>  name !== "");
        arrayHistory.forEach(function(name){
            addHistory(name, 'extract');
        });
    }
};
// Добавление истории поиска
const  addHistory = (input,mode) => {
    const newTag= document.createElement('span');
    newTag.innerHTML = input;
    newTag.className = "history_element";
    history.insertBefore(newTag,history.children[1]);
    if(mode !== 'extract') {SaveHistory(input);}
};
// это ограничение на размер истории и видимость пламени Суртура)))
const checkHistory = () => {
    while (history.children.length > 20) {
        history.removeChild(history.lastChild);
    }
    if(history.children.length < 2){
        closeHistory.className = 'history_water';
    } else { closeHistory.className = 'history_fire'; }
};

//это поиск
const subscribeToSubmit = () => {
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        addHistory(input.value,'search');
        checkHistory();
        search(input.value);
    });
};
//тут для поиска событие
input.oninput = debounce(flowInput,875);
function flowInput(){
    let different;
    if(history.children[1] !== undefined || resultsContainer.length > 0) {
        let arrayLastInput = history.children[1].innerHTML
            .toLowerCase();
        let arrayInput = input.value
            .toLowerCase()
            .split(" ")
            .filter((name) => name !== "");
        different = arrayInput.filter(function (teg) {
            return arrayLastInput.indexOf(teg) < 0;
        });
    }else {different = [1]}
        if (different.length !== 0) {
            search(input.value);
        }

}
//это событие на скрол страницы, чтобы стиль поиска менялся
window.onscroll = function() {
    let scrolled = window.pageYOffset || document.documentElement.scrollTop;
    if (scrolled > 50) {
        form.className = 'search_scroll';
    }
    else {form.className = 'search';}
};
//переход от 1 стиля ко 2
form.onclick = function() {
    form.className = 'search';
    result.className = 'title_result';
};
//это событие загрузки страницы
window.onload = function () {
    ExtractionHistory();
    checkHistory();
};
//удаление элемента истории
const moveElem = (element, mode) =>{
    let newString = localStorage.getItem('history')
        .split('|value|')
        .filter((name) =>  name !== element.innerHTML)
        .join('|value|');
    localStorage.clear();
    if(mode === 'remove') { history.removeChild(element);}
    else{newString+=element.innerHTML+'|value|';}
    localStorage.setItem('history',newString);
};
//обработка нажатия истории
history.addEventListener('click',function (e) {
    if(event.target.className === 'history_fire'){
        while (history.children[1]) {
            history.removeChild(history.children[1]);
        }
        localStorage.clear();
        closeHistory.className = 'history_water';
    }
    else{
        if(event.target.className !== 'history') {
            if(e.altKey){
                moveElem(event.target,'remove');
                checkHistory();
            } else {
                input.value = event.target.innerHTML;
                history.insertBefore(event.target, history.children[1]);
                moveElem(event.target,'move');
                search(event.target.innerHTML);
            }
        }
    }
});

subscribeToSubmit();

