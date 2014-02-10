# SpaceGraph-JS

Virtual life & robotics simulation environment for Javascript/WebGL

Uses Ammo.JS and Three.JS to create an interactive simulation that can serve as embodiment for _artificial intelligence_ components.

Ammo.JS is a Javascript port of the Bullet3D rigid-body kinematics physics engine.

[![Preview Video](http://img.youtube.com/vi/jdQ9TF7VnqI/0.jpg)](http://youtu.be/jdQ9TF7VnqI)


## Senses
* Proprioception: orientation, linear velocity, angular velocity
* Vision: in-world ray tracing
* (more coming soon)

## Motors
* Rotation joint
* (more coming soon)

## Agents
* Agents can be developed to generate motor signals from observed sense signals.
* Agents may be implemented in Javascript (ideally in a web-worker thread) or integrated remotely via WebSockets or HTTP connection.


_NOTE_: The code is very messy and needs some work before it can be easily used.

## Controls
* Left Mouse Drag (on object) - pull objects around
* Left Mouse Drag (off object) - rotate scene
* Right Mouse Click (on object) - auto-zoom to a specific object (smooth LERP coming soon)
* Right Mouse Drag - zoom in/out
* 'G' - toggle shadows
* (more coming soon)

