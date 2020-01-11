/*jshint node:true */
"use strict";
/*
 * Copyright 2017 Ian Boston <ianboston@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const Bacon = require('baconjs');
const fs = require('fs');



module.exports = function(app) {
  var BME280, barometer;
  if ( fs.existsSync('/sys/class/i2c-adapter') ) { 
    // 1 wire is enabled a
    BME280 = require('./BME280');

    console.log("signalk-enviro: BME280 avaiable. ");
  } else {
    BME280 = require('./fakesensor');
    console.log("signalk-enviro: BME280 is not enabled, Created Fake Sensor ");
  }
  var plugin = {};
  var unsubscribes = [];



  function convertToK(v) {
    return v+273.15;
  }




  plugin.start = function(config) {
    // console.log("Enviro Config ", JSON.stringify(config));
    try {
      var barometer = new BME280({address: 0x76});
      barometer.begin((err, type) => {
        if (err) {
            console.info('signalk-enviro: error initializing barometer', err);
            return;
        }
  
        console.info('barometer running ',type);

        // read the BME280
        plugin.enviroInterval = setInterval(() => {

            barometer.readPressureAndTemparature((err, pressure, temperature, humidity) => {
                if ( err ) {
                    console.log("Error Reading BME280 ",err);
                } else {
                    var delta = {
                      "context": "vessels." + app.selfId,
                      "updates": [
                        {
                          "source": {
                            "src": "BME280"
                          },
                          "timestamp": (new Date()).toISOString(),
                          "values": [
                            {
                              "path": "environment.outside.temperature",
                              "value": convertToK(temperature)
                            },
                            {
                              "path": "environment.outside.pressure",
                              "value": pressure
                            },
                            {
                              "path": "environment.outside.humidity",
                              "value": humidity
                            }
                          ]
                        }
                      ]
                    };        
                    //console.log("signalk-enviro: got enviro data: " + JSON.stringify(delta))
                    app.handleMessage(plugin.id, delta);
                }
            });
          }, config.enviroPeriod*1000);
      });
    } catch(e) {
        console.info('error initializing barometer', e);
    }    
  };

  plugin.stop = function() {
    if ( plugin.enviroInterval !== undefined ) {
      clearInterval(plugin.enviroInterval);
    }
  }

  plugin.id = "sk-enviro"
  plugin.name = "Enviromental data Source"
  plugin.description = "Plugin that reads Pressure, temp, %RH  data from a BME280"

  var sensorConfig = {};

  


  plugin.schema = {
    title: "Enviromental Sensors",
    description: "This plugin reads a BME280 environment sensor providing pressure, temperature and %RH.",
    type: "object",
    properties: {
      enviroPeriod : {
        title: "Period",
        description: "period between deltas from this plugin in seconds.",
        type: "integer",
        default: 10
      }
    }
  }



  plugin.uiSchema = {
    "ui:order": [
    'enviroPeriod'
    ]
  };


  return plugin;
}
