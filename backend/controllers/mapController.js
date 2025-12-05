import { validationResult } from "express-validator";
import {
  getAddressCoordinates,
  getDistanceAndTime,
  getAutoCompleteResults,
} from "../services/mapServices.js";

export const getCoordinates = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { address } = req.query;

  try {
    const coordinates = await getAddressCoordinates(address);
    return res.status(200).json({ data: coordinates });
  } catch (e) {
    return res.status(404).json({ error: "Coordinates not found" });
  }
};

export const getDistanceTime = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { origin, destination } = req.query;

  try {
    const result = await getDistanceAndTime(origin, destination);
    return res.status(200).json({ data: result });
  } catch (e) {
    return res.status(404).json({ error: "Route not found" });
  }
};

export const getAutoCompleteSuggestions = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { input } = req.query;

  try {
    const suggestions = await getAutoCompleteResults(input);
    return res.status(200).json({ data: suggestions });
  } catch (e) {
    return res.status(500).json({ error: "Failed to fetch suggestions" });
  }
};
