/**
 * Межигірська, 24, літ. «Б», Поділ — 677.8 м² у контурі схеми:
 * 559.2 прочитано зі сканів, 91.0 не розібрано,
 * 27.6 коридор лівого крила без номера.
 * Власник називає 623 м² — розбіжність закриває експлікація техпаспорта.
 *
 * ЗГЕНЕРОВАНО: node tools/build-site.mjs. Руками не правити —
 * джерело даних лежить у tools/build-floors.mjs.
 *
 * Планування побудовані за сканами БТІ від 12.01.07. Це схема, а не обмір:
 * для угоди, суду чи узаконення вона не годиться.
 * Орендарів і ставок немає: їх заповнюють, коли з'являються договори.
 */

import type { Site } from '../mock'

export const MEZHYHIRSKA: Site = {
  "id": "mezhyhirska",
  "name": "Межигірська",
  "address": "вул. Межигірська, 24, літ. «Б», Поділ",
  "buildings": [
    {
      "id": "mezhyhirska-building",
      "label": "Окрема будівля вул. Межигірська",
      "kind": "office",
      "floors": [
        {
          "id": "basement",
          "label": "Цокольний",
          "viewBox": "0 0 988 592",
          "corridors": [
            {
              "polygon": [
                [
                  157,
                  262
                ],
                [
                  422,
                  262
                ],
                [
                  422,
                  340
                ],
                [
                  157,
                  340
                ]
              ],
              "label": "Коридор 1",
              "area": 12.9
            },
            {
              "polygon": [
                [
                  550,
                  217
                ],
                [
                  895,
                  217
                ],
                [
                  895,
                  269
                ],
                [
                  550,
                  269
                ]
              ],
              "label": "Коридор 5",
              "area": 11.3
            },
            {
              "polygon": [
                [
                  437,
                  122
                ],
                [
                  535,
                  122
                ],
                [
                  535,
                  262
                ],
                [
                  437,
                  262
                ]
              ],
              "label": "ІІ (сходи)",
              "area": 8.6
            },
            {
              "polygon": [
                [
                  437,
                  267
                ],
                [
                  535,
                  267
                ],
                [
                  535,
                  354
                ],
                [
                  437,
                  354
                ]
              ],
              "label": "ІІІ (тамбур)",
              "area": 5.3
            }
          ],
          "rooms": [
            {
              "id": "basement-1",
              "label": "6",
              "area": 9.6,
              "polygon": [
                [
                  126,
                  122
                ],
                [
                  240,
                  122
                ],
                [
                  240,
                  257
                ],
                [
                  126,
                  257
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "basement-2",
              "label": "7",
              "area": 15,
              "polygon": [
                [
                  244,
                  122
                ],
                [
                  422,
                  122
                ],
                [
                  422,
                  257
                ],
                [
                  244,
                  257
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "basement-3",
              "label": "3",
              "area": 26.8,
              "polygon": [
                [
                  83,
                  345
                ],
                [
                  297,
                  345
                ],
                [
                  297,
                  546
                ],
                [
                  83,
                  546
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "basement-4",
              "label": "4",
              "area": 15.1,
              "polygon": [
                [
                  302,
                  345
                ],
                [
                  422,
                  345
                ],
                [
                  422,
                  546
                ],
                [
                  302,
                  546
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "basement-5",
              "label": "1",
              "area": 5.3,
              "polygon": [
                [
                  550,
                  122
                ],
                [
                  645,
                  122
                ],
                [
                  645,
                  212
                ],
                [
                  550,
                  212
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "basement-6",
              "label": "4",
              "area": 4.8,
              "polygon": [
                [
                  649,
                  122
                ],
                [
                  735,
                  122
                ],
                [
                  735,
                  212
                ],
                [
                  649,
                  212
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "basement-7",
              "label": "2",
              "area": 5.3,
              "polygon": [
                [
                  740,
                  122
                ],
                [
                  834,
                  122
                ],
                [
                  834,
                  212
                ],
                [
                  740,
                  212
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "basement-8",
              "label": "не розібрано",
              "area": 3.2,
              "polygon": [
                [
                  839,
                  122
                ],
                [
                  896,
                  122
                ],
                [
                  896,
                  212
                ],
                [
                  839,
                  212
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "basement-9",
              "label": "8",
              "area": 13.8,
              "polygon": [
                [
                  550,
                  274
                ],
                [
                  682,
                  274
                ],
                [
                  682,
                  442
                ],
                [
                  550,
                  442
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "basement-10",
              "label": "9",
              "area": 9.7,
              "polygon": [
                [
                  687,
                  274
                ],
                [
                  779,
                  274
                ],
                [
                  779,
                  442
                ],
                [
                  687,
                  442
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "basement-11",
              "label": "10",
              "area": 10.3,
              "polygon": [
                [
                  784,
                  274
                ],
                [
                  882,
                  274
                ],
                [
                  882,
                  442
                ],
                [
                  784,
                  442
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "basement-12",
              "label": "не розібрано",
              "area": 11.5,
              "polygon": [
                [
                  437,
                  359
                ],
                [
                  535,
                  359
                ],
                [
                  535,
                  546
                ],
                [
                  437,
                  546
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            }
          ]
        },
        {
          "id": "floor-1",
          "label": "І поверх",
          "viewBox": "0 0 988 592",
          "corridors": [
            {
              "polygon": [
                [
                  22,
                  258
                ],
                [
                  422,
                  258
                ],
                [
                  422,
                  368
                ],
                [
                  22,
                  368
                ]
              ],
              "label": "Коридор лівого крила (номер не читається)",
              "area": 27.6
            },
            {
              "polygon": [
                [
                  550,
                  273
                ],
                [
                  906,
                  273
                ],
                [
                  906,
                  356
                ],
                [
                  550,
                  356
                ]
              ],
              "label": "Коридор 1",
              "area": 18.5
            },
            {
              "polygon": [
                [
                  437,
                  122
                ],
                [
                  535,
                  122
                ],
                [
                  535,
                  373
                ],
                [
                  437,
                  373
                ]
              ],
              "label": "ІІ (сходи)",
              "area": 15.4
            }
          ],
          "rooms": [
            {
              "id": "floor-1-1",
              "label": "7",
              "area": 17.3,
              "polygon": [
                [
                  65,
                  122
                ],
                [
                  277,
                  122
                ],
                [
                  277,
                  253
                ],
                [
                  65,
                  253
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-2",
              "label": "1",
              "area": 11.5,
              "polygon": [
                [
                  281,
                  122
                ],
                [
                  422,
                  122
                ],
                [
                  422,
                  253
                ],
                [
                  281,
                  253
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-3",
              "label": "не розібрано",
              "area": 3.1,
              "polygon": [
                [
                  22,
                  122
                ],
                [
                  60,
                  122
                ],
                [
                  60,
                  253
                ],
                [
                  22,
                  253
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-4",
              "label": "3",
              "area": 13.3,
              "polygon": [
                [
                  25,
                  373
                ],
                [
                  224,
                  373
                ],
                [
                  224,
                  480
                ],
                [
                  25,
                  480
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-5",
              "label": "5",
              "area": 7.8,
              "polygon": [
                [
                  25,
                  484
                ],
                [
                  188,
                  484
                ],
                [
                  188,
                  561
                ],
                [
                  25,
                  561
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-6",
              "label": "не розібрано",
              "area": 1.5,
              "polygon": [
                [
                  193,
                  484
                ],
                [
                  224,
                  484
                ],
                [
                  224,
                  561
                ],
                [
                  193,
                  561
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-7",
              "label": "2",
              "area": 23.8,
              "polygon": [
                [
                  229,
                  373
                ],
                [
                  422,
                  373
                ],
                [
                  422,
                  570
                ],
                [
                  229,
                  570
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-8",
              "label": "2",
              "area": 12.9,
              "polygon": [
                [
                  550,
                  122
                ],
                [
                  692,
                  122
                ],
                [
                  692,
                  268
                ],
                [
                  550,
                  268
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-9",
              "label": "3",
              "area": 10.2,
              "polygon": [
                [
                  697,
                  122
                ],
                [
                  808,
                  122
                ],
                [
                  808,
                  268
                ],
                [
                  697,
                  268
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-10",
              "label": "4",
              "area": 13,
              "polygon": [
                [
                  813,
                  122
                ],
                [
                  956,
                  122
                ],
                [
                  956,
                  268
                ],
                [
                  813,
                  268
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-11",
              "label": "не розібрано",
              "area": 2.9,
              "polygon": [
                [
                  911,
                  273
                ],
                [
                  966,
                  273
                ],
                [
                  966,
                  356
                ],
                [
                  911,
                  356
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-12",
              "label": "11",
              "area": 18.8,
              "polygon": [
                [
                  550,
                  361
                ],
                [
                  694,
                  361
                ],
                [
                  694,
                  570
                ],
                [
                  550,
                  570
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-13",
              "label": "10",
              "area": 14.1,
              "polygon": [
                [
                  699,
                  361
                ],
                [
                  807,
                  361
                ],
                [
                  807,
                  570
                ],
                [
                  699,
                  570
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-14",
              "label": "9",
              "area": 12.3,
              "polygon": [
                [
                  812,
                  361
                ],
                [
                  906,
                  361
                ],
                [
                  906,
                  570
                ],
                [
                  812,
                  570
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-15",
              "label": "не розібрано",
              "area": 7.3,
              "polygon": [
                [
                  910,
                  361
                ],
                [
                  966,
                  361
                ],
                [
                  966,
                  570
                ],
                [
                  910,
                  570
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-16",
              "label": "не розібрано",
              "area": 11.7,
              "polygon": [
                [
                  437,
                  378
                ],
                [
                  535,
                  378
                ],
                [
                  535,
                  570
                ],
                [
                  437,
                  570
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-1-17",
              "label": "7 (прибудова)",
              "area": 9.5,
              "polygon": [
                [
                  798,
                  32
                ],
                [
                  966,
                  32
                ],
                [
                  966,
                  122
                ],
                [
                  798,
                  122
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            }
          ]
        },
        {
          "id": "floor-2",
          "label": "ІІ поверх",
          "viewBox": "0 0 988 592",
          "corridors": [
            {
              "polygon": [
                [
                  153,
                  273
                ],
                [
                  422,
                  273
                ],
                [
                  422,
                  357
                ],
                [
                  153,
                  357
                ]
              ],
              "label": "Коридор 1",
              "area": 14.1
            },
            {
              "polygon": [
                [
                  550,
                  263
                ],
                [
                  906,
                  263
                ],
                [
                  906,
                  356
                ],
                [
                  550,
                  356
                ]
              ],
              "label": "Коридор 1",
              "area": 20.7
            },
            {
              "polygon": [
                [
                  437,
                  122
                ],
                [
                  535,
                  122
                ],
                [
                  535,
                  382
                ],
                [
                  437,
                  382
                ]
              ],
              "label": "ІІІ (сходи)",
              "area": 15.9
            }
          ],
          "rooms": [
            {
              "id": "floor-2-1",
              "label": "4",
              "area": 18.3,
              "polygon": [
                [
                  125,
                  122
                ],
                [
                  325,
                  122
                ],
                [
                  325,
                  268
                ],
                [
                  125,
                  268
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-2",
              "label": "5",
              "area": 8.4,
              "polygon": [
                [
                  330,
                  122
                ],
                [
                  422,
                  122
                ],
                [
                  422,
                  268
                ],
                [
                  330,
                  268
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-3",
              "label": "не розібрано",
              "area": 8.9,
              "polygon": [
                [
                  22,
                  122
                ],
                [
                  120,
                  122
                ],
                [
                  120,
                  268
                ],
                [
                  22,
                  268
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-4",
              "label": "не розібрано",
              "area": 6.6,
              "polygon": [
                [
                  22,
                  273
                ],
                [
                  149,
                  273
                ],
                [
                  149,
                  357
                ],
                [
                  22,
                  357
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-5",
              "label": "3",
              "area": 13.9,
              "polygon": [
                [
                  38,
                  362
                ],
                [
                  241,
                  362
                ],
                [
                  241,
                  472
                ],
                [
                  38,
                  472
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-6",
              "label": "не розібрано",
              "area": 11.8,
              "polygon": [
                [
                  38,
                  476
                ],
                [
                  241,
                  476
                ],
                [
                  241,
                  570
                ],
                [
                  38,
                  570
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-7",
              "label": "2",
              "area": 23,
              "polygon": [
                [
                  245,
                  362
                ],
                [
                  422,
                  362
                ],
                [
                  422,
                  570
                ],
                [
                  245,
                  570
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-8",
              "label": "2",
              "area": 12.4,
              "polygon": [
                [
                  550,
                  122
                ],
                [
                  696,
                  122
                ],
                [
                  696,
                  258
                ],
                [
                  550,
                  258
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-9",
              "label": "3",
              "area": 10.2,
              "polygon": [
                [
                  701,
                  122
                ],
                [
                  821,
                  122
                ],
                [
                  821,
                  258
                ],
                [
                  701,
                  258
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-10",
              "label": "4",
              "area": 11.9,
              "polygon": [
                [
                  826,
                  122
                ],
                [
                  966,
                  122
                ],
                [
                  966,
                  258
                ],
                [
                  826,
                  258
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-11",
              "label": "не розібрано",
              "area": 3.3,
              "polygon": [
                [
                  911,
                  263
                ],
                [
                  966,
                  263
                ],
                [
                  966,
                  356
                ],
                [
                  911,
                  356
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-12",
              "label": "12",
              "area": 19.1,
              "polygon": [
                [
                  550,
                  361
                ],
                [
                  696,
                  361
                ],
                [
                  696,
                  570
                ],
                [
                  550,
                  570
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-13",
              "label": "11",
              "area": 14.3,
              "polygon": [
                [
                  701,
                  361
                ],
                [
                  811,
                  361
                ],
                [
                  811,
                  570
                ],
                [
                  701,
                  570
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-14",
              "label": "10",
              "area": 11.1,
              "polygon": [
                [
                  815,
                  361
                ],
                [
                  900,
                  361
                ],
                [
                  900,
                  570
                ],
                [
                  815,
                  570
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-15",
              "label": "не розібрано",
              "area": 8,
              "polygon": [
                [
                  905,
                  361
                ],
                [
                  966,
                  361
                ],
                [
                  966,
                  570
                ],
                [
                  905,
                  570
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-16",
              "label": "не розібрано",
              "area": 11.2,
              "polygon": [
                [
                  437,
                  386
                ],
                [
                  535,
                  386
                ],
                [
                  535,
                  570
                ],
                [
                  437,
                  570
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-17",
              "label": "2 (прибудова)",
              "area": 9.7,
              "polygon": [
                [
                  733,
                  26
                ],
                [
                  895,
                  26
                ],
                [
                  895,
                  122
                ],
                [
                  733,
                  122
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            },
            {
              "id": "floor-2-18",
              "label": "9",
              "area": 4,
              "polygon": [
                [
                  900,
                  26
                ],
                [
                  966,
                  26
                ],
                [
                  966,
                  122
                ],
                [
                  900,
                  122
                ]
              ],
              "tenant": null,
              "tenantPhone": null,
              "rent": null,
              "marketRent": null,
              "contractNo": null,
              "movedInAt": null,
              "priceReviewAt": null,
              "leaseUntil": null
            }
          ]
        }
      ]
    }
  ]
}
