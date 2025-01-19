const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const app = express();

const port = 3000;

const url = 'https://es.wikipedia.org/wiki/Categor%C3%ADa:M%C3%BAsicos_de_rap';

app.get('/', async (req, res) => {
    try {
        const response = await axios.get(url);

        if (response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);

            const links = [];  // creo array links

            // Extraer los links de los músicos y los guardo en array links
            $('#mw-pages a').each((index, elements) => {
                const link = $(elements).attr('href');
                const linkCompleto = `https://es.wikipedia.org${link}`;  // guardo la url completa para poder hacer click e ir a esa url externa a mi servidor
                links.push(linkCompleto);
            });

            // Procesar cada link de músico
            const musicos = await Promise.all(  // aplico await a todas las promesas
                links.map(async (link) => {  // voy recorriendo array links y entrando en cada link
                    try {
                        const response = await axios.get(link);
                        if (response.status === 200) {  // si el link es correcto ...
                            const html = response.data;
                            const $ = cheerio.load(html);

                            const title = $('h1').text();
                            const contenido = $('p').first().text();
                            const imagenes = [];

                            // Extraer imágenes
                            $('img').each((index, elements) => {
                                const src = $(elements).attr('src');
                                if (src) {
                                    const imagenCompleta = src.startsWith('http')
                                        ? src
                                        : `https:${src}`;
                                    imagenes.push(imagenCompleta);
                                }
                            });

                            return { title, contenido, imagenes };
                        }
                    } catch (error) {
                        console.error(`Error al procesar el link ${link}: ${error.message}`);
                        return null; // Retornar null si algo falla
                    }
                })
            );

            // Filtrar nulos y enviar la respuesta
            const resultados = musicos.filter((musico) => musico !== null);
            res.json(resultados); // Enviar resultados en formato JSON
        }
    } catch (error) {
        console.error(`Error al cargar la página principal: ${error.message}`);
        res.status(500).send('Error al procesar la solicitud.');
    }
});

app.listen(port, () => {
    console.log(`Server escuchando en puerto: ${port}`);
});


