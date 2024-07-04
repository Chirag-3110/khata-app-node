import express, { Request, Response } from 'express';
import Role from '../models/Role';

export const getRoles=async(req:any,res:any)=>{
    try {
        const roles = await Role.find();
        res.status(200).json(roles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

export const addNewRoles=async(req:any,res:any)=>{
    const { role } = req.body;

    if (!role) {
        return res.status(400).json({ message: 'Role is required' });
    }

    try {
        const newRole = new Role({ role });
        await newRole.save();
        res.status(201).json(newRole);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

